import { cn } from "@/lib/utils"
import React, { ReactNode } from "react"

const MaxWidthWrapper = ({
    className,
    children
}:{
    className?:string
    children: ReactNode
}) => {         //cn -> class name merge
    return(<div className={cn("mx-auto w-full max-w-screen-xl px-2.5 md:px-14",className)}>
        {children}
    </div>)
}

export default MaxWidthWrapper