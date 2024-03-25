import {useMemo} from 'react';
import Chart from 'react-apexcharts';

import ReactApexChart from 'react-apexcharts';
import {useQuery} from "@tanstack/react-query";
import authAxios from "@/utils/axios.ts";

import {Col} from "react-bootstrap";

const Statuses = {
    'not-started': 'Не начато',
    'in-progress': 'В процессе',
    'finished': 'Завершен',
}

export type StatisticsProps = {
    idx: string
}

export type StatisticsStatusItem = {
    status: string,
    count: string
}

export type StatisticsResultItem = {
    totalPoints: string,
    count: string
}

const StatisticChart = ({idx}: StatisticsProps) => {

    const {data: statistics} = useQuery({
        queryKey: [`${idx}`],
        refetchInterval: 5000,
        queryFn: async () => {
            const {data} = await authAxios.get(`/test/exam-sessions/${idx}/statistics`)
            return data
        },
        select: (data) => data.data.statistics
    })


    const byStatusLabel = useMemo(() => {
        if (statistics) return statistics?.byStatus.map((item: StatisticsStatusItem) => Statuses[item.status as keyof typeof Statuses] + " (" + item.count + ")" )
        else return []
    }, [statistics])

    const byStatusCount = useMemo(() => {
        if (statistics) return statistics?.byStatus.map((item: StatisticsStatusItem) => parseInt(item.count))
        else return []
    }, [statistics])

    const sumAllStatusCount = useMemo(() => {
        if (statistics) return statistics?.byStatus.map((item: StatisticsStatusItem) => parseInt(item.count)).reduce((a: number, b: number) => a + b, 0)
        else return []
    }, [statistics])

    const byResultLabel = useMemo(() => {
        if (statistics) return statistics?.byResult.map((item: StatisticsResultItem) => item.totalPoints + "%")
        else return []
    }, [statistics])

    const byResultCount = useMemo(() => {
        if (statistics) return statistics?.byResult.map((item: StatisticsResultItem) => parseInt(item.count))
        else return []
    }, [statistics])


    const chartOptions = {
        // Define your chart options here
        series: byStatusCount,
        chart: {
            width: 380,
            type: 'pie',
        },
        options: {
            colors: ['#69c546', '#008FFB', '#e06565'],
            labels: byStatusLabel,
            chart: {
                width: 200
            },
            legend: {
                position: 'bottom'
            }
        }
    };

    const resultsChartOptions = {
        options: {
            title: {
                text: 'Общая таблица результатов',
            },
            chart: {
                id: 'apexchart-example'
            },
            xaxis: {
                categories: byResultLabel,
            }
        },
        series: [{
            name: 'Количество',
            data: byResultCount,
        }]
    }


    return (
        <>
            <p><b className="text-danger">Общее количество экзаменуемых:</b> {sumAllStatusCount}</p>
            <Col xs={12} md={3}>
                <ReactApexChart
                    options={chartOptions.options}
                    series={chartOptions.series}
                    type={chartOptions.chart.type}
                    height={320}
                />
            </Col>
            <Col xs={12} md={9}>
                <div className="overflow-x-scroll">
                    <Chart
                        options={resultsChartOptions.options}
                        series={resultsChartOptions.series}
                        type="bar" width={1200}
                        height={320}/>
                </div>
            </Col>
        </>
    );
};

export default StatisticChart;