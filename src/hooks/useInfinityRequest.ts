import { useCallback, useMemo, useState } from "react";
import { Order } from "@/types/enums.ts";
import useAxios from "@/hooks/useAxios.ts";
import { useDebounce } from "@/hooks/useDebounce.ts";
import {useInfiniteQuery} from "@tanstack/react-query";

type ParamsType = {
    url: string;
    params?: {[key: string]: string | number};
    key: string;
    queryKey?: string | string[];
    enabled?: boolean;
    keepPreviousData?: boolean;
}

const useInfinityRequest: T = (_params: ParamsType) => {
    const axios = useAxios();

    const [take] = useState<number>(50);
    const [order, setOrder] = useState<Order | null>(null);
    const [sortBy, setSortBy] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [searchBy, setSearchBy] = useState(null);

    const debouncedSearch = useDebounce(search, 500);

    const {
        data,
        isFetching,
        isError,
        error,
        refetch,
        hasNextPage,
        fetchNextPage
    } = useInfiniteQuery({
        enabled: _params.enabled,
        queryKey: [_params.queryKey, debouncedSearch, order],
        keepPreviousData: _params.keepPreviousData,
        queryFn: async ({pageParam = 1}) => {
            if (pageParam === false) pageParam = 1;

            const params = {
                ..._params.params || {},
                take,
                skip: take * pageParam - take
            };

            if(searchBy) params.search_by = searchBy;

            if (search && search.length >= 3) {
                params.search = search
            }

            if (order && sortBy) {
                params.order = order;
                params.sort_by = sortBy;
            }

            const {data} = await axios.get<T>(_params.url, {params})
            return {...data.data, prevPage: pageParam}
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage.prevPage || (take * lastPage.prevPage >= lastPage.total)) return null;
            return lastPage.prevPage + 1;
        }
    });

    const objects = useMemo(() => {
        return data?.pages.flatMap(page => page[_params.key]) || [];
    }, [data]);

    const onSearch = useCallback((field: string, value: string) => {
        setSearchBy(field);
        setSearch(value);
    }, []);

    const onSort = useCallback((field: string) => {
        setOrder(order === Order.ASC ? Order.DESC : Order.ASC);
        setSortBy(field);
    }, [order]);

    return {
        data,
        objects,
        isFetching,
        isError,
        error,
        refetch,
        hasNextPage,
        fetchNextPage,
        onSearch,
        onSort,
        sortBy,
        order,
        search,
        searchBy
    }
}

export default useInfinityRequest;