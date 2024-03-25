import useStateContext from "@/hooks/useStateContext.tsx";
import { useEffect, useMemo } from "react";
import { ACTIONS } from "@/utils/constants.ts";
import ReactApexChart from "react-apexcharts";
import { Card, Col, Container, Row, Tab, Table, Tabs } from "react-bootstrap";
import { useQuery } from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios.ts";
import CardHeader from "react-bootstrap/CardHeader";
import authAxios from "@/utils/axios.ts";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";

type FacultyType = {
    branch: {
        en: string;
        uz: string;
        ru: string;
    };
    faculty: string;
    faculty_suffix: string;
    count: number;
}

type StatisticsType = {
    data: {
        statistics: {
            byEducationType: Array<{
                name: {
                    en: string;
                    uz: string;
                    ru: string;
                };
                education_type: string;
                count: number;
            }>;
            byFaculty: FacultyType[];
        }
    }
};

const DashboardPage = () => {
    const { dispatch} = useStateContext();
    const axios = useAxios();
    const checkPermission = useCheckPermission();

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [{label: 'Панель управления', path: '/'}]
        })
    }, [dispatch]);

    const chartOptions = {
        series: [],
        options: {
            chart: {
                type: 'donut',
            },
            colors: ['#69c546', '#008FFB', '#e06565'],
            legend: {
                position: 'bottom'
            },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Общее',
                                formatter: function (w) {
                                    return w.globals.seriesTotals.reduce((a, b) => {
                                        return a + b
                                    }, 0)
                                }
                            }
                        }
                    }
                },
            }
        }
    };
    const barOptions = {
        series: [{
            name: '',
            data: []
        }],
        options: {
            chart: {
                type: 'bar',
                height: 350,
                toolbar: {
                    show: false
                },
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    endingShape: 'rounded'
                },
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            xaxis: {
                categories: [],
            },
            fill: {
                opacity: 1
            },
            tooltip: {
                y: {
                    formatter: function (val) {
                        return val
                    }
                }
            }
        },
    };

    const {data} = useQuery({
        enabled: !!checkPermission(1401),
        queryKey: ['statistics'],
        queryFn: async () => {
            const response = await axios.get<StatisticsType>('/cabinet/dashboard/statistics');
            return response.data;
        },
        select: (data) => data.data.statistics
    })

    const {data: faculties} = useQuery({
        enabled: !!checkPermission(1401),
        queryKey: ['faculties'],
        queryFn: async () => {
            const {data} = await authAxios.get('/core/faculties/all');
            return data
        },
        select: (data) => data.data.faculties
    })

    const byEduType = useMemo(() => {
        type BranchType = {
            name: string;
            full_time?: number;
            evening_time?: number;
            extramural?: number;
            chart?: any;
        };
        const _branches:BranchType[] = [...new Set(data?.byEducationType.map((item: any) => item.name.en))]
            .map((item: string) => {
                return {
                    name: item,
                    full_time: 0,
                    evening_time: 0,
                    extramural: 0
                }
            });

        data?.byEducationType.forEach((item: { name: {en: string},count: number, education_type: string }) => {
            if(!_branches.find((branch: any) => branch.name === item.name.en)) return;
            _branches.find((branch: any) => branch.name === item.name.en)[item.education_type] = item.count;
        })

        _branches.map((branch) => {
                branch.chart = {
                    ...chartOptions,
                    series: [
                        branch.full_time,
                        branch.evening_time,
                        branch.extramural
                    ],
                    options: {
                        ...chartOptions.options,
                        labels: ['Очное обучение', 'Вечернее обучение', 'Заочное обучение'],
                    }
                }

                return branch;
            });

        return _branches;
    }, [data]);

    const byFaculty = useMemo(() => {
        type BranchType = {
            name: string;
            faculties?: Array<{
                faculty: string;
                count: number;
                faculty_suffix: string;
            }>;
            series?: any;
            options?: any;
        }
        const _branches: BranchType[] = [...new Set(data?.byEducationType.map((item: any) => item.name.en))]
            .map((name: string) => {
                return {
                    name
                }
            });

        data?.byFaculty.forEach((item: FacultyType) => {
            const foundBranchIndex = _branches.findIndex((branch: BranchType) => branch.name === item.branch.en);
            if(foundBranchIndex < 0) return;

            _branches[foundBranchIndex] = {
                ..._branches[foundBranchIndex],
                faculties: [
                    ..._branches[foundBranchIndex].faculties || [],
                    {
                        faculty: item.faculty,
                        count: item.count,
                        faculty_suffix: item.faculty_suffix
                    }
                ]
            }
        })

        return _branches.map((branch: BranchType) => {
            const seriesData = branch.faculties?.map(i => i.count);
            const categories = branch.faculties?.map(i => i.faculty_suffix);

            return {
                name: branch.name,
                series: [{ ...barOptions.series[0], data: seriesData }],
                options: { ...barOptions.options, xaxis: { ...barOptions.options.xaxis, categories } }
            };
        });
    }, [data]);

    const facultyAbbrs = useMemo(() => {
        if (!faculties) return [];

        const _faculties = [...new Set(faculties.map((item: any) => item.suffix))].map(i => {
            return faculties.find((faculty: any) => faculty.suffix === i);
        });
        const pairArray = [];


        for (let i = 0; i < _faculties.length; i += 2) {
            pairArray.push([_faculties[i], _faculties[i + 1]]);
        }

        return pairArray;
    }, [faculties]);

    return (
        <Container fluid="lg">
            { checkPermission(1401) && data && <div>
                <Row>
                    {
                        byEduType.map((item: any, index: number) => (
                            <Col
                                xs={ 12 }
                                md={ 4 }
                                key={ index }
                            >
                                <Card className="pb-2">
                                    <CardHeader>
                                        <h4>{ item.name }</h4>
                                    </CardHeader>

                                    <ReactApexChart
                                        options={ item.chart.options }
                                        series={ item.chart.series }
                                        type={ item.chart.options.chart.type }
                                        width="100%"
                                    />
                                </Card>
                            </Col>
                        ))
                    }

                    <Col md={ 12 } className="my-4">
                        <Tabs
                            defaultActiveKey={byFaculty[0].name}
                            id="uncontrolled-tab-example"
                            fill
                        >
                            {
                                byFaculty.map((item, index) => (
                                    <Tab
                                        eventKey={ item.name }
                                        title={ item.name }
                                        key={ index }
                                    >
                                        <Tab.Content>
                                            <div className="card border-top-0 rounded-top-0">
                                                <ReactApexChart
                                                    options={ item.options }
                                                    series={ item.series }
                                                    type={ item.options.chart.type }
                                                    height={500}
                                                />
                                            </div>
                                        </Tab.Content>
                                    </Tab>
                                ))
                            }
                        </Tabs>
                    </Col>

                    <Col md={ 12 }>
                        <Table
                            striped
                            bordered
                        >
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Abbr</th>
                                <th>Name</th>
                                <th>#</th>
                                <th>Abbr</th>
                                <th>Name</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                facultyAbbrs?.map((item, index) => (
                                    <tr key={ index }>
                                        <td>
                                            { index === 0 ? 1 : index * 2 + 1 }
                                        </td>
                                        <td>
                                            { item[0]?.suffix }
                                        </td>
                                        <td>
                                            { item[0]?.name.en }
                                        </td>
                                        {
                                            item[1] && (
                                                <>
                                                    <td>
                                                        { index === 0 ? 2 : index * 2 + 2 }
                                                    </td>
                                                    <td>
                                                        { item[1]?.suffix }
                                                    </td>
                                                    <td>
                                                        { item[1]?.name.en }
                                                    </td>
                                                </>
                                            )
                                        }
                                    </tr>
                                ))
                            }
                            </tbody>
                        </Table>
                    </Col>
                </Row>
            </div> }
        </Container>
    )
};

export default DashboardPage;