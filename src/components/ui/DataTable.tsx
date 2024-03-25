import { Form, Table } from "react-bootstrap";
import { useCallback } from "react";
import classNames from "classnames";
import { ScaleLoader } from "react-spinners";
import { AxiosError } from "axios";
import { DataTableHeadersType, GenericResponse } from "@/types";
import ProgressLinearAnimation from "@/components/ui/ProgressLinearAnimation.tsx";

type PropsType<T> = {
    headers: DataTableHeadersType<T>[];
    data: T[];
    isFetching: boolean;
    isError: boolean;
    error: AxiosError<GenericResponse>;
    selectable?: [string[], (selectedItems: string[]) => void];
    notFoundText?: string;
}

const DataTable = <T, >(props: PropsType<T>) => {
    const { headers, data, isFetching, isError, error, selectable, notFoundText } = props;
    const [selectedItems, setSelectedItems] = selectable || [[], () => {}];

    const selectItem = useCallback((idx: string) => {
        const isSelectedComps = selectedItems.includes(idx);

        if (isSelectedComps) {
            setSelectedItems(selectedItems.filter((item) => item !== idx))
        } else {
            setSelectedItems([...selectedItems, idx])
        }
    }, [selectedItems, setSelectedItems])

    return (
        <Table
            striped
            bordered
            hover
            responsive
        >
            <thead>
            <tr>
                { !!selectable && <th></th> }
                <th>#</th>
                { headers.map((header, index) => (
                    <th
                        key={ index }
                        style={ header.style }
                        className={ header.className }
                    >
                        { header.sortable ? header.sortable() : header.label }
                    </th>
                )) }
            </tr>
            {
                headers.some(header => header.searchable) && (
                    <tr>
                        { !!selectable && <th></th> }
                        <th></th>
                        { headers.map((header, index) => (
                            <th key={ index }>
                                { header.searchable ? header.searchable() : null }
                            </th>
                        )) }
                    </tr>
                )
            }
            </thead>
            <tbody className={ classNames('position-relative', { 'tbody--is-loading': isFetching && data?.length }) }>
            {
                isFetching && !data?.length ? (
                    <tr>
                        <td colSpan={ 8 }>
                            <div className="d-flex justify-content-center">
                                <ScaleLoader
                                    height={ 15 }
                                    color="#0d6efd"
                                />
                            </div>
                        </td>
                    </tr>
                ) : isError ? (
                        <tr>
                            <td
                                colSpan={ 7 }
                                className="fst-italic text-center text-danger"
                            >
                                { (error as AxiosError<GenericResponse>)?.response?.data?.message || (error as AxiosError)?.message }
                            </td>
                        </tr>
                ) : Array.isArray(data) && data.length > 0 ? (
                    <>
                        { isFetching && data.length && <tr>
                            <td
                                className="p-0"
                                colSpan={ 8 }
                            >
                                <div className="position-absolute start-0 end-0">
                                    <ProgressLinearAnimation/>
                                </div>
                            </td>
                        </tr>
                        }
                        { data.map((row, index) => (
                            <tr key={ index }>
                                { !!selectable &&
                                    <th>
                                        <Form.Check
                                            type="checkbox"
                                            className="btn-icon"
                                        >
                                            <Form.Check.Input
                                                checked={ selectedItems.includes(row.id) }
                                                onChange={ () => {
                                                    selectItem(row.id)
                                                } }
                                                className="btn-icon"
                                            />
                                        </Form.Check>
                                    </th>
                                }
                                <td className="align-middle">{ index + 1 }</td>

                                { headers.map((header, index) => (
                                    <td key={ index } className="align-middle">
                                        { header.render ? header.render(row) : row[header.key] }
                                    </td>
                                )) }
                            </tr>
                        )) }
                    </>
                ) : (
                    <tr>
                        <td colSpan={ headers.length + 1 }>{ notFoundText ?? 'Ничего не найдено' }</td>
                    </tr>
                )
            }
            </tbody>
        </Table>
    );
}

export default DataTable;