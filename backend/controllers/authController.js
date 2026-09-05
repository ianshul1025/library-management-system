import { generate } from "otp-generator";
import User from "../models/User.js";
import sendOtp from "../utils/sendOTP.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

// Step 1: Register user
export async function registerUser(req, res) {
    try {
        // Get user details from request body
        const { name, email, phone, password } = req.body;

        // Check if email is provided
        if (!email) {
            return res.status(400).json({
                message: "Email is required."
            });
        }

        // Remove all non-digit characters from phone number
        const cleanPhone = phone
            ? phone.toString().replace(/\D/g, "")
            : "";

        // Check if phone number contains exactly 10 digits
        if (cleanPhone.length !== 10) {
            return res.status(400).json({
                message: "Phone number must be exactly of 10 digits."
            });
        }

        // Check if a user with this email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // If the existing user is already verified, registration is not allowed
            if (existingUser.isVerified) {
                return res.status(400).json({
                    message: "User already exists"
                });
            }

            // Delete the existing unverified user
            await User.deleteOne({ email });
        }

        // Generate a 6-digit OTP
        const otp = generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
        });

        // Send OTP to user's email
        try {
            await sendOtp(email, otp);
        } catch (emailError) {
            console.error("Error sending OTP email:", emailError);

            return res.status(500).json({
                message: "Failed to send OTP email. Please try again later."
            });
        }

        // Hash user's password before storing it
        const hashedpassword = await bcrypt.hash(password, 10);

        // Set OTP expiry time (5 minutes)
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        // Generate unique student ID
        const studentId = `ST-${uuidv4().slice(0, 8).toUpperCase()}`;

        // Create new user
        const user = await User.create({
            name,
            email,
            phone: cleanPhone,
            password: hashedpassword,
            otp,
            otpExpiry,
            studentId
        });

        // Send success response
        res.status(201).json({
            message: "User registered successfully. Please check your email for the OTP.",
            user
        });

    } catch (error) {
        console.error("Error registering user:", error);

        res.status(500).json({
            message: "Error registering user",
            error: error.message
        });
    }
}


// Step 2: Verify OTP
export async function verifyOtp(req, res) {
    try {
        const { email, otp } = req.body;

        // Check if email is provided
        if (!email) {
            return res.status(400).json({
                message: "Email is required."
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        // Check if OTP is valid and not expired
        if (user.otp !== otp || new Date() > user.otpExpiry) {
            return res.status(400).json({
                message: "Invalid or expired OTP"
            });
        }

        // Mark user as verified and remove OTP details
        Object.assign(user, {
            isVerified: true,
            otp: null,
            otpExpiry: null
        });

        await user.save();

        res.status(200).json({
            message: "OTP verified successfully."
        });

    } catch (error) {
        console.error("Error verifying OTP:", error);

        res.status(500).json({
            message: "Error verifying OTP",
            error: error.message
        });
    }
}


// Step 3: Complete profile
export async function completeProfile(req, res) {
    try {
        const {
            email,
            department,
            stream,
            semester,
            year,
            rollNo
        } = req.body;

        // Check if email is provided
        if (!email) {
            return res.status(400).json({
                message: "Email is required."
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(400).json({
                message: "User is not verified"
            });
        }

        // Update profile details
        Object.assign(user, {
            department,
            stream,
            semester,
            year,
            rollNo,
            isProfileComplete: true
        });

        await user.save();

        res.status(200).json({
            message: "Profile completed successfully."
        });

    } catch (error) {
        console.error("Error completing profile:", error);

        res.status(500).json({
            message: "Error completing profile",
            error: error.message
        });
    }
}


// Login as a student
export async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Check if user's email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email with OTP before logging in."
            });
        }

        // Compare entered password with hashed password
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Exclude password from response
        const { password: _, ...userResponse } = user.toObject();

        res.status(200).json({
            success: true,
            token,
            user: userResponse
        });

    } catch (error) {
        console.error("Error during logging in:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}


// Get current user profile (me)
export async function getProfile(req, res) {
    try {
        // Find currently logged-in user
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Error fetching user profile:", error);

        res.status(500).json({
            message: "Error fetching user profile",
            error: error.message
        });
    }
}


// Update user profile
export async function updateProfile(req, res) {
    try {
        const {
            name,
            email,
            phone,
            department,
            stream,
            semester,
            academicYear,
            rollNumber
        } = req.body;

        // Find current user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Update email if provided
        if (email) {
            const normalizedEmail = email.trim().toLowerCase();

            // Check if email has changed
            if (normalizedEmail !== user.email.toLowerCase()) {

                // Students are not allowed to change their email
                if (user.role === "user") {
                    return res.status(400).json({
                        message: "Students are not allowed to change their email address"
                    });
                }

                // Check if email is already in use
                if (
                    await User.findOne({
                        email: normalizedEmail,
                        _id: { $ne: user._id }
                    })
                ) {
                    return res.status(400).json({
                        message: "Email already in use"
                    });
                }

                user.email = normalizedEmail;
            }
        }

        // Update phone number if provided
        if (phone) {
            const cleanPhone = phone
                .toString()
                .replace(/\D/g, "");

            // Check if phone number contains exactly 10 digits
            if (cleanPhone.length !== 10) {
                return res.status(400).json({
                    message: "Mobile number must be exactly 10 digits"
                });
            }

            user.phone = cleanPhone;
        }

        // Update other profile fields
        if (name) user.name = name;
        if (department) user.department = department;
        if (stream) user.stream = stream;
        if (semester) user.semester = semester;
        if (academicYear) user.year = academicYear;
        if (rollNumber) user.rollNo = rollNumber;

        // Save updated profile
        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });

    } catch (error) {
        console.error("Error updating profile:", error);

        res.status(500).json({
            message: "Error updating profile",
            error: error.message
        });
    }
}


// Get all student accounts (Admin)
export async function getUsers(req, res) {
    try {
        // Find all verified and completed student accounts
        const users = await User.find({
            role: "user",
            isVerified: true,
            isProfileComplete: true
        }).select("-password");

        res.status(200).json({
            success: true,
            users
        });

    } catch (error) {
        console.error("Error fetching users:", error);

        res.status(500).json({
            message: "Error fetching users",
            error: error.message
        });
    }
}


// Admin registration
export async function registerAdmin(req, res) {
    try {
        const {
            name,
            email,
            phone,
            password
        } = req.body;

        // Check if all required fields are provided
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check if admin already exists
        if (await User.findOne({ email })) {
            return res.status(400).json({
                message: "Admin already exists with this email"
            });
        }

        // Hash admin password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin account
        const user = await User.create({
            name,
            email: email.trim().toLowerCase(),
            phone,
            password: hashedPassword,
            role: "admin",
            isVerified: true,
        });

        // Exclude password from response
        const { password: _, ...userResponse } = user.toObject();

        res.status(201).json({
            success: true,
            message: "Admin registered successfully",
            user: userResponse
        });

    } catch (error) {
        console.error("Error registering admin:", error);

        res.status(500).json({
            message: "Error registering admin",
            error: error.message
        });
    }
}