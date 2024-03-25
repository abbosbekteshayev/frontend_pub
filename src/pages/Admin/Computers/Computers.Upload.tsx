import {Alert, Button, Card, Container, Table, Form} from "react-bootstrap";
import FileUpload from "@/components/ui/FileUpload.tsx";
import {useCallback, useEffect, useState} from "react";
import {ACTIONS} from "@/utils/constants.ts";
import {useMutation, useQuery} from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios.ts";
import useStateContext from "@/hooks/useStateContext.tsx";
import {toast} from "react-toastify";
import {Branch, Computer, Room} from "@/types/entities.ts";

const ComputersUpload = () => {
    const {dispatch} = useStateContext();
    const axios = useAxios();
    const [computers, setComputers] = useState([]);
    const [rooms, setRooms] = useState<string[]>([]);

    const [hasError, setHasError] = useState<boolean>(true);
    const [ips, setIps] = useState<string[]>([]);

    const [branch, setBranch] = useState<string>('');

    const {
        data: branches,
        isFetching: branchIsFetching,
        error: branchError,
        isError: branchIsError
    } = useQuery({
        queryKey: ['computers-branch'],
        queryFn: async () => {
            const {data} = await axios.get('/core/branches/all')
            return data
        },
        select: (data) => data.data.branches
    })

    const {data: dataRooms, isFetching: roomsFetching} = useQuery({
        queryKey: ['computers-rooms', branch],
        enabled: !!branch,
        queryFn: async (context) => {
            const {data} = await axios.get(`/core/rooms/all/${context.queryKey[1]}`)
            return data
        },
        select: (data) => data.data.rooms
    })

    useEffect(() => {
        if (dataRooms) {
            setRooms(dataRooms.map((room: Room) => room.name))
        }
    }, [dataRooms])

    const {
        data,
        isFetching,
        error,
        isError,
    } = useQuery({
        queryKey: ['computers-all'],
        enabled: !!branch,
        queryFn: async () => {
            const {data} = await axios.get(`/core/computers/all`)
            return data
        },
        select: (data) => data.data.computers
    })

    useEffect(() => {
        if (data) {
            setIps(data.map((computer: Computer) => computer.ip))
        }
    }, [data]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
            for (const file of acceptedFiles) {
                if (file.type !== 'text/csv') {
                    toast.error('Файл должен быть в формате CSV')
                    return
                }

                const reader = new FileReader()
                let errors = false
                reader.onload = async (e) => {
                    // read csv file. headers: room, ip
                    const csv = e.target?.result as string
                    const lines = csv.split('\n')
                    const headers = lines[0].split(',')
                    const roomIndex = headers.findIndex((header: string) => header.includes('room'))
                    const ipIndex = headers.findIndex((header: string) => header.includes('ip'))

                    const computers = []

                    for (const line of lines.slice(1)) {
                        const value = line.split(',')

                        if (value.length !== 2) {
                            continue
                        }

                        const values = {
                            room: value[roomIndex].trim(),
                            ip: value[ipIndex].split('\r')[0].trim(),
                            errors: {}
                        }

                        // validate room
                        if (!rooms.includes(values.room)) {
                            values.errors.room = 'Комната не найдена'
                            errors = true
                        }

                        // validate ip
                        if (ips.includes(values.ip)) {
                            values.errors.ip = 'IP уже занят'
                            errors = true
                        }

                        computers.push(values)
                    }
                    setComputers(computers)
                    setHasError(errors)
                }
                reader.readAsText(file)
            }
        },
        [rooms, ips]
    )

    const {
        mutate,
        isLoading,
    } = useMutation({
        mutationFn: async () => {
            const {data} = await axios.post('/core/computers/bulk', {branch_id: branch, computers})
            return data
        },
        onSuccess: () => {
            toast.success('Компьютеры успешно добавлены')
            setComputers([])
        },
        onError: () => {
            toast.error('Ошибка при добавлении компьютеров')
        }
    })

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                {label: 'Компьютеры', path: '/computers/'},
                {label: 'Загрузить', path: '/computers/upload'}
            ]
        })
    }, [dispatch]);

    return (
        <Container fluid="lg">
            <Card className="animate__animated animate__faster animate__fadeIn shadow">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5>
                            Загрузить компьютеры
                        </h5>
                        <Button variant="success" disabled={hasError || isLoading} onClick={() => mutate()}>
                            Сохранить
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Form.Group>
                        <Form.Label>Филиал</Form.Label>
                        <Form.Control
                            as="select"
                            onChange={(e) => setBranch(e.target.value)}
                            value={branch}
                        >
                            <option value="">Выберите филиал</option>
                            {
                                branches?.map((branch: Branch) => (
                                    <option key={branch.id} value={branch.id}>{branch.name.ru}</option>
                                ))
                            }
                        </Form.Control>
                    </Form.Group>
                    {isFetching || branchIsFetching || roomsFetching
                        ? <p>Загрузка...</p>
                        : isError || branchIsError ?
                            <Alert variant="danger" className="mt-3">
                                <p>Ошибка: {error?.response?.data.message || error?.message || branchError?.response?.data.message || branchError?.message}</p>
                            </Alert>
                            : computers.length > 0 ? (
                                <Table striped bordered hover responsive>
                                    <thead>
                                    <tr>
                                        <th>Комната</th>
                                        <th>IP</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {computers.map((computer, index) => (
                                        <tr key={index}>
                                            <td
                                                className={computer.errors?.room ? 'bg-danger' : 'bg-success'}
                                                title={computer.errors?.room ? computer.errors.room : ''}
                                            >
                                                {computer.room}
                                            </td>
                                            <td
                                                className={computer.errors?.ip ? 'bg-danger' : 'bg-success'}
                                                title={computer.errors?.ip ? computer.errors.ip : ''}
                                            >
                                                {computer.ip}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            ) : branch ? (
                                <FileUpload onDrop={onDrop}/>
                            ) : false}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ComputersUpload;