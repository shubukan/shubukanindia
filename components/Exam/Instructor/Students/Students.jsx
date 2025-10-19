// components/Exam/Instructor/Students/Students.jsx
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { shubukan_api } from "@/config";
import ExamBtn from "../../UI/ExamBtn";
import Loader from "@/components/UIComponent/Loader/Loader";

export default function Students() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("instructor_token");
    if (!t) return router.push("/online-exam");
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await shubukan_api.get("/instructor/students", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("instructor_token")}`,
        },
      });
      setStudents(res.data || []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sid) => {
    if (!confirm("Delete this student?")) return;
    try {
      await shubukan_api.delete(`/instructor/student/${sid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("instructor_token")}`,
        },
      });
      setStudents((s) => s.filter((st) => st._id !== sid));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="ExamChild w-full flex flex-col items-center">
      <label className="w-full font-[600] text-[14px] sm:text-[16px] text-[#334155]">
        My Students
      </label>

      {loading ? (
        <Loader loading={loading} />
      ) : students.length === 0 ? (
        <p className="text-[14px] text-gray-500">No students found</p>
      ) : (
        <div className="w-full flex flex-col gap-4 pb-[32px]">
          {students.map((s) => (
            <div
              key={s._id}
              className="OnlineExam corner-shape w-full h-fit flex flex-col p-[16px] shadow-md border !rounded-[40px]"
            >
              <div className="w-full h-[40px] border-b-1 border-dashed flex flex-row items-center">
                <p className="w-[160px] sm:w-full font-[600] sm:text-center text-[14px] sm:text-[16px] pl-2 text-[#334155]">
                  Name
                </p>
                <div className="border-r-1 border-dashed h-full"></div>
                <p className="w-full sm:text-center text-[14px] sm:text-[16px] pl-2 text-[#334155]">
                  {s.name}
                </p>
              </div>

              <div className="w-full h-[40px] border-b-1 border-dashed flex flex-row items-center">
                <p className="w-[160px] sm:w-full font-[600] sm:text-center text-[14px] sm:text-[16px] pl-2 text-[#334155]">
                  Present Kyu
                </p>
                <div className="border-r-1 border-dashed h-full"></div>
                <p className="w-full sm:text-center text-[14px] sm:text-[16px] pl-2 text-[#334155]">
                  {s.presentKyu ?? "Student not selected"}
                </p>
              </div>

              <div className="w-full p-4 pb-2 flex flex-row items-end justify-center">
                {/* <ExamBtn
                text="Delete"
                size="w-full sm:w-[150px]"
                disabled={true}
                disabled={true}
                onClick={() => handleDelete(s._id)}
                /> */}
                <ExamBtn
                  text="View Results"
                  size="w-full sm:w-[150px] min-w-fit"
                  onClick={() =>
                    router.push(
                      `/online-exam/instructor/results?studentId=${s._id}`
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Loader loading={loading} />
    </div>
  );
}
