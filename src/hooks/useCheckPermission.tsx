import useStateContext from "@/hooks/useStateContext.tsx";
import { useCallback } from "react";
import { UserRole } from "@/schemas/Users.schema.ts";

const useCheckPermission = () => {
    const { state: { authUser } } = useStateContext();

    return useCallback((code: number) => {
        if (!authUser) return false;

        return authUser.roles.includes(UserRole.ADMIN) ||
            (authUser.staff && authUser.staff.permissions.includes(code))
    }, [authUser]);
}

export default useCheckPermission;