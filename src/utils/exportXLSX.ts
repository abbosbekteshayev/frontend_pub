import * as XLSX from "xlsx";
import {ExamCredentials, ExamResult} from "@/api/ExamSession.api.ts";

export const exportExamResults = (data: ExamResult[]) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Exam Results");
    XLSX.writeFile(wb, `exam_results_${new Date().toLocaleDateString()}.xlsx`);
}

export const exportExamCredentials = (data: ExamCredentials[]) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Exam Credentials");
    XLSX.writeFile(wb, `exam_credentials_${new Date().toLocaleDateString()}.xlsx`);
}