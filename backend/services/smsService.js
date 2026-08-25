import axios from "axios";

export const sendOtpSMS = async(phone, otp)=>{
    const formattedPhone = phone.replace(/^\+91\s*/, "").trim();

    const response = await axios.post(
        "https://www.fast2sms.com/dev/bulkV2",
        {
            variables_values: otp,
            route: "otp",
            numbers: formattedPhone,
        },
        {
            headers: {
                Authorization: process.env.FAST2SMS_API_KEY,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data;
}