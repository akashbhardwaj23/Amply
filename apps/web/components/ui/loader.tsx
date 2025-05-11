import {motion} from "motion/react"


export function Loader({
    className = "h-8 w-8"
}: {
    className? : string
}){
    return <motion.div
    animate={{rotate : 360}}
    transition={{duration : 2 , repeat:Infinity}}
    className={`rounded-full ${className} border-2 border-white border-t-2 border-t-black`}>

    </motion.div>
}