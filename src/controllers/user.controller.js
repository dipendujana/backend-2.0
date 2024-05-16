import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessTokrn = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessTokrn, refreshToken }




    } catch (error) {
        throw new ApiError(500, "Something went worng white generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username,email
    // check for images, check for avatar
    // upload than to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh tokan field from response
    // check for user creation 
    // return res


    const { fullName, email, username, password } = req.body
    console.log("email:", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username alrady existe")

    }
    // console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLoaclPath = req.files?.coverImage[0]?.path;

    let coverImageLoaclPath;
    if (req.files && Array.isArray(req.files.
        coverImage) && req.files.coverImage.length > 0) {
        coverImageLoaclPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar files is requred")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLoaclPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Somethin went worn while registring the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User register Successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data 
    // username or emain 
    // find the user 
    // password check
    // access and refersh token
    // send cookie

    const { email, username, password } = req.body

    if (!username || !email) {
        throw new ApiError(400, "username or password is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User dose not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Ivalid user credentials")
    }

    const { accessTokrn, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedINUser = await User.findById(user._id).
        select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200).
        cookie("accessTokrn", accessTokrn, options)
        .cookie(refreshToken, refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                user: loggedINUser, accessTokrn,
                refreshToken
            },
                "User logged in Successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }

    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User loggrd Out"))

})

export {
    registerUser,
    loginUser,
    logoutUser
}