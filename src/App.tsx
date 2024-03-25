import './assets/sass/globals.scss'
import useStateContext from "@/hooks/useStateContext.tsx";
import { Navigate, Route, Routes } from "react-router-dom";
import { Lazy } from "@/components/ui/Lazy";
import { UserRole } from "@/schemas/Users.schema.ts";

// Auth Pages
import LoginPage from "@/pages/Auth/Login.tsx";
import SignUpPage from "@/pages/Auth/SignUp.tsx";

// Layouts
import AdminLayout from "@/layout/Layout";
import StudentLayout from "@/layout/StudentLayout";
import { useMemo } from "react";
import AuthMiddleware from "@/middlewares/Auth.middleware.tsx";
import * as process from "process";

// Admin Pages
const DashboardPage = () => import("@/pages/Admin/Dashboard.tsx");
const BranchesListPage = () => import("@/pages/Admin/Branches/Branches.List.tsx");
const FacultiesListPage = () => import("@/pages/Admin/Faculties/Faculties.List.tsx");
const FacultiesGroupsListPage = () => import("@/pages/Admin/Faculties/Faculties.Detail.tsx");
const GroupsListPage = () => import("@/pages/Admin/Groups/Groups.List.tsx");
const GroupStudentsPage = () => import("@/pages/Admin/Groups/Groups.Detail.tsx");
const RoomsListPage = () => import("@/pages/Admin/Rooms/Rooms.List.tsx");
const ComputersListPage = () => import("@/pages/Admin/Computers/Computers.List.tsx");
const StaffListPage = () => import("@/pages/Admin/Staff/Staff.List.tsx");
const PermissionListPage = () => import("@/pages/Admin/Permissions/Permissions.List.tsx");
const TeachersListPage = () => import("@/pages/Admin/Teachers/Teachers.List.tsx");
const StudentsListPage = () => import("@/pages/Admin/Students/Students.List.tsx");
const StudentsImportPage = () => import("@/pages/Admin/Students/Students.Import.tsx");
const StudentsResultsImportPage = () => import("@/pages/Admin/Students/StudentsResults.Import.tsx");
const TestBankListPage = () => import("@/pages/Admin/Testbank/Testbank.List.tsx");
const TestBankUploadPage = () => import("@/pages/Admin/Testbank/Testbank.Upload.tsx");
const TestBankDetailPage = () => import("@/pages/Admin/Testbank/Testbank.Detail.tsx");
const ExamSessionListPage = () => import("@/pages/Admin/ExamSessions/ExamSessions.List.tsx");
const ExamSessionCreatePage = () => import("@/pages/Admin/ExamSessions/ExamSessions.Create.tsx");
const ExamSessionDetailPage = () => import("@/pages/Admin/ExamSessions/ExamSessions.Detail.tsx");
const ExamSessionAnswerSheetPage = () => import("@/pages/Admin/ExamSessions/ExamSessions.AnswerSheet.tsx");
const ExamSchedulesUpload = () => import("@/pages/Admin/ExamSchedules.Upload.tsx");
const UsersListPage = () => import("@/pages/Admin/Users/Users.List.tsx");
const UsersDetailPage = () => import("@/pages/Admin/Users/Users.Detail.tsx");
const AccessDeniedPage = () => import("@/pages/AccessDenied.tsx");
const ComputerUploadPage = () => import("@/pages/Admin/Computers/Computers.Upload.tsx");
const BulkUploadPage = () => import("@/pages/Admin/ExamSessions/ExamSessions.BulkUpload.tsx");

// Student Pages
const TrainerList = () => import("@/pages/Student/Trainer/Trainer.List.tsx");
const TrainerResults = () => import("@/pages/Student/Trainer/Trainer.Results.tsx");
const Results = () => import("@/pages/Student/Results.tsx");
const Fails = () => import("@/pages/Student/Fails.tsx");
const ExamSchedule = () => import("@/pages/Student/ExamSchedule.tsx");
const Contacts = () => import("@/pages/Student/Contacts.tsx");

const App = () => {
    const {state: {authUser}} = useStateContext();

    const studentRoutes = useMemo(() => (
        <Route
            path="/"
            element={ <StudentLayout/> }
        >
            <Route
                index
                element={ <Lazy component={ TrainerList }/> }
            />
            <Route
                path="access-denied"
                element={ <Lazy component={ AccessDeniedPage }/> }
            />
            <Route
                path="trainer/results"
                element={ <Lazy component={ TrainerResults }/> }
            />
            {
                import.meta.env.MODE === 'development' && (
                    <>
                        <Route
                            path="results"
                            element={ <Lazy component={ Results }/> }
                        />
                        <Route
                            path="fails"
                            element={ <Lazy component={ Fails }/> }
                        />
                        <Route
                            path="exam-schedule"
                            element={ <Lazy component={ ExamSchedule }/> }
                        />
                    </>
                )
            }
            <Route
                path="contacts"
                element={ <Lazy component={ Contacts }/> }
            />
        </Route>
    ), []);

    const adminRoutes = useMemo(() => (
        <Route
            path="/"
            element={ <AdminLayout/> }
        >
            <Route
                index
                element={ <Lazy component={ DashboardPage }/> }
            />
            <Route
                path="access-denied"
                element={ <Lazy component={ AccessDeniedPage }/> }
            />
            <Route path="branches">
                <Route
                    index
                    element={ <Lazy component={ BranchesListPage }/> }
                />
                <Route
                    path=":idx"
                    element={ <Lazy component={ FacultiesListPage }/> }
                />
            </Route>
            <Route path="faculties">
                <Route
                    index
                    element={ <Lazy component={ FacultiesListPage }/> }
                />
                <Route
                    path=":idx"
                    element={ <Lazy component={ FacultiesGroupsListPage }/> }
                />
            </Route>
            <Route path="groups">
                <Route
                    index
                    element={ <Lazy component={ GroupsListPage }/> }
                />
                <Route
                    path=":idx"
                    element={ <Lazy component={ GroupStudentsPage }/> }
                />
            </Route>
            <Route path="rooms">
                <Route
                    index
                    element={ <Lazy component={ RoomsListPage }/> }
                />
                <Route
                    path=":idx"
                    element={ <Lazy component={ ComputersListPage }/> }
                />
            </Route>
            <Route path="computers">
                <Route
                    index
                    element={ <Lazy component={ ComputersListPage }/> }
                />
                <Route
                    path="import"
                    element={ <Lazy component={ ComputerUploadPage }/> }
                />
                <Route
                    path=":idx"
                    element={ <Lazy component={ DashboardPage }/> }
                />
            </Route>
            <Route path="staff">
                <Route
                    index
                    element={ <Lazy component={ StaffListPage }/> }
                />
                <Route
                    path="permissions"
                    element={ <Lazy component={ PermissionListPage }/> }
                />
                <Route
                    path="import"
                    element={ <Lazy component={ DashboardPage }/> }
                />
                <Route
                    path=":idx"
                    element={ <Lazy component={ DashboardPage }/> }
                />
            </Route>
            <Route path="teachers">
                <Route
                    index
                    element={ <Lazy component={ TeachersListPage }/> }
                />
                <Route
                    path="import"
                    element={ <Lazy component={ DashboardPage }/> }
                />
                <Route
                    path=":idx"
                    element={ <Lazy component={ DashboardPage }/> }
                />
            </Route>
            <Route path="students">
                <Route
                    index
                    element={ <Lazy component={ StudentsListPage }/> }
                />
                <Route
                    path="import"
                    element={ <Lazy component={ StudentsImportPage }/> }
                />
                <Route
                    path="import-results"
                    element={ <Lazy component={ StudentsResultsImportPage }/> }
                />
                <Route
                    path=":idx"
                    element={ <Lazy component={ DashboardPage }/> }
                />
            </Route>
            <Route path="test-bank">
                <Route
                    index
                    element={ <Lazy component={ TestBankListPage }/> }
                />
                <Route
                    path="upload"
                    element={ <Lazy component={ TestBankUploadPage }/> }
                />
                <Route
                    path=":idx"
                    element={ <Lazy component={ TestBankDetailPage }/> }
                />
            </Route>
            <Route path="exam-sessions">
                <Route
                    index
                    element={ <Lazy component={ ExamSessionListPage }/> }
                />
                <Route
                    path="create"
                    element={ <Lazy component={ ExamSessionCreatePage }/> }
                />
                <Route path=":idx">
                    <Route
                        index
                        element={ <Lazy component={ ExamSessionDetailPage }/> }
                    />
                    <Route
                        path="answer-sheets/:answerSheetIdx"
                        element={ <Lazy component={ ExamSessionAnswerSheetPage }/> }
                    />
                    <Route
                        path="bulk-upload"
                        element={ <Lazy component={ BulkUploadPage }/> }
                    />
                </Route>
            </Route>
            <Route path="exam-schedule">
                <Route
                    index
                    element={ <Lazy component={ ExamSchedulesUpload }/> }
                />
            </Route>
            <Route path="users">
                <Route
                    index
                    element={ <Lazy component={ UsersListPage }/> }
                />
                <Route
                    path=":idx"
                    element={ <Lazy component={ UsersDetailPage }/> }
                />
                <Route
                    path="permissions"
                    element={ <Lazy component={ PermissionListPage }/> }
                />
                <Route
                    path=":idx"
                    element={ <Lazy component={ DashboardPage }/> }
                />
            </Route>
        </Route>
    ), []);

    const routes = useMemo(() => (
        authUser?.roles.includes(UserRole.STUDENT) ? studentRoutes : adminRoutes
    ), [adminRoutes, authUser, studentRoutes]);

    return (
        <AuthMiddleware>
            <Routes>
                <Route
                    path="/auth/login"
                    element={ <LoginPage/> }
                />
                <Route
                    path="/auth/sign-up"
                    element={ <SignUpPage/> }
                />

                { authUser && routes }

                { authUser && (
                        <Route
                            path="*"
                            element={ <Navigate to="/"/> }
                        />
                    ) }

            </Routes>
        </AuthMiddleware>
    );
};

export default App;