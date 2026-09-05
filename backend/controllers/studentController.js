import User from "../models/User.js";

// Search students by their roll number
export async function searchStudentsByRoll(req, res) {
    try {
        // Get the roll number from the query parameter.
        // Example: /api/students/search?roll=23304
        const roll = String(req.query.roll || "").trim();

        // If no roll number is provided, return an empty student list.
        if (!roll) {
            return res.status(200).json({
                success: true,
                student: []
            });
        }

        // Create a case-insensitive regular expression
        // to search for the given roll number.
        const rollRegex = new RegExp(roll, "i");

        // Find users who:
        // 1. Have the role "user"
        // 2. Have completed their profile
        // 3. Have a roll number matching the search
        const students = await User.find({
            role: "user",
            isProfileComplete: true,
            rollNo: { $regex: rollRegex }
        })
            // Select only the fields required for the student search result.
            .select("name email department stream semester year rollNo")

            // Return a maximum of 12 matching students.
            .limit(12);

        // Convert the MongoDB documents into the format
        // that will be sent back in the API response.
        const mappedStudents = students.map((student) => ({
            name: student.name,
            email: student.email,
            department: student.department || "",
            stream: student.stream || "",
            academicYear: student.year || "",
            semester: student.semester || "",
            rollNumber: student.rollNo || "",
        }));

        // Send the successfully found students to the client.
        res.status(200).json({
            success: true,
            students: mappedStudents
        });
    }

    // Handle any error that occurs while searching for students.
    catch (error) {
        console.error("Error searching students by roll:", error);

        res.status(500).json({
            success: false,
            message: "Error searching student by roll"
        });
    }
}