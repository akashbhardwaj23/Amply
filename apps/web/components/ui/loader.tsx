import {motion} from "motion/react"


export function Loader(){
    return <motion.div
    animate={{rotate : 360}}
    transition={{duration : 2 , repeat:Infinity}}
    className="h-8 w-8 rounded-full border-4 border-gray-600 border-t-2 border-t-black">

    </motion.div>
}