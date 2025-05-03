import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import userRouter from "./routes/user"

dotenv.config();
const app = express();

app.use(cors())


app.use("/api", userRouter);


app.listen(process.env.PORT, () => {
    console.log(`Server Running at ${process.env.PORT}`)
})