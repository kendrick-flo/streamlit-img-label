import React, { useEffect, useState } from "react"
import {
    ComponentProps,
    Streamlit,
    withStreamlitConnection,
} from "streamlit-component-lib"
import { fabric } from "fabric"
import styles from "./StreamlitImgLabel.module.css"

interface FabricObjectProps {
    top: number
    left: number
    width: number
    height: number
}

interface PythonArgs {
    canvasWidth: number
    canvasHeight: number
    rects: FabricObjectProps[]
    points: FabricObjectProps[]
    boxColor: string
    pointColor: string
    imageData: Uint8ClampedArray
}

const StreamlitImgLabel = (props: ComponentProps) => {
    const [mode, setMode] = useState<string>("light")
    const [canvas, setCanvas] = useState(new fabric.Canvas(""))
    const { canvasWidth, canvasHeight, imageData }: PythonArgs = props.args
    const [newBBoxIndex, setNewBBoxIndex] = useState<number>(0)
    const [newPointIndex, setNewPointIndex] = useState<number>(0)

    /*
     * Translate Python image data to a JavaScript Image
     */
    var invisCanvas = document.createElement("canvas")
    var ctx = invisCanvas.getContext("2d")

    invisCanvas.width = canvasWidth
    invisCanvas.height = canvasHeight

    // create imageData object
    let dataUri: any
    if (ctx) {
        var idata = ctx.createImageData(canvasWidth, canvasHeight)

        // set our buffer as source
        idata.data.set(imageData)

        // update canvas with new data
        ctx.putImageData(idata, 0, 0)
        dataUri = invisCanvas.toDataURL()
    } else {
        dataUri = ""
    }

    // Initialize canvas on mount and add a rectangle
    useEffect(() => {
        // const { points, rects, boxColor, pointColor }: PythonArgs = props.args
        const canvasTmp = new fabric.Canvas("c", {
            enableRetinaScaling: false,
            backgroundImage: dataUri,
            uniScaleTransform: true,
        })

        // rects.forEach((rect) => {
        //     const { top, left, width, height } = rect
        //     canvasTmp.add(
        //         new fabric.Rect({
        //             left,
        //             top,
        //             fill: "",
        //             width,
        //             height,
        //             objectCaching: true,
        //             stroke: boxColor,
        //             strokeWidth: 1,
        //             strokeUniform: true,
        //             hasRotatingPoint: false,
        //         })
        //     )
        // })

        setCanvas(canvasTmp)
        Streamlit.setFrameHeight()
        // eslint-disable-next-line
    }, [canvasHeight, canvasWidth, dataUri])

    // Create defualt bounding box
    const defaultBox = () => ({
        left: canvasWidth * 0.15 + newBBoxIndex * 3,
        top: canvasHeight * 0.15 + newBBoxIndex * 3,
        width: canvasWidth * 0.2,
        height: canvasHeight * 0.2,
    })

    const defaultPoint = () => ({
        left: canvasWidth * 0.15 + newPointIndex * 3,
        top: canvasHeight * 0.15 + newPointIndex * 3,
        width: canvasWidth * 0.01,
        height: canvasHeight * 0.01,
    })

    // Add new bounding box to be image
    const addBoxHandler = () => {
        if (newBBoxIndex === 50) {
            setNewBBoxIndex(0);
        } else {
            setNewBBoxIndex(newBBoxIndex + 1);
        }
        const box = defaultBox()
        canvas.add(
            new fabric.Rect({
                ...box,
                fill: "",
                objectCaching: true,
                stroke: props.args.boxColor,
                strokeWidth: 1,
                strokeUniform: true,
                hasRotatingPoint: false,
            })
        )
        sendCoordinates()
    }

    const addPointHandler = () => {
        if (newPointIndex === 50) {
            setNewPointIndex(0);
        } else {
            setNewPointIndex(newPointIndex + 1);
        }
        const point = defaultPoint()
        canvas.add(
            new fabric.Circle({
                ...point,
                radius: point.width,
                fill: props.args.pointColor,
                objectCaching: true,
                stroke: props.args.pointColor,
                strokeWidth: 1,
                strokeUniform: true,
                hasRotatingPoint: false,
            })
        )
        sendCoordinates()
    }

    // Remove the selected bounding box
    const removeHandler = () => {
        // const selectIndex = canvas.getObjects().indexOf(selectObject)
        const selectObject = canvas.getActiveObject()
        canvas.remove(selectObject)
        sendCoordinates()
    }

    // Remove all the bounding boxes
    const clearAllHandler = () => {
        setNewBBoxIndex(0)
        setNewPointIndex(0)
        canvas.getObjects().forEach((rect) => canvas.remove(rect))
        sendCoordinates()
    }

    // Send the coordinates of the rectangle back to streamlit.
    const sendCoordinates = () => {
        const rects = canvas.getObjects()
            .filter(rect => rect.isType("rect"))
            .map((rect, i) => ({
                ...rect.getBoundingRect()
            }))
        const points = canvas.getObjects()
            .filter(point => point.isType("circle"))
            .map((point, i) => ({
                ...point.getCenterPoint(),
            }))
        Streamlit.setComponentValue({ rects, points })
    }

    // Update the bounding boxes when modified
    useEffect(() => {
        if (!canvas) {
            return
        }
        const handleEvent = () => {
            canvas.renderAll()
            sendCoordinates()
        }

        canvas.on("object:modified", handleEvent)
        return () => {
            canvas.off("object:modified")
        }
    })

    // Adjust the theme according to the system
    const onSelectMode = (mode: string) => {
        setMode(mode)
        if (mode === "dark") document.body.classList.add("dark-mode")
        else document.body.classList.remove("dark-mode")
    }

    useEffect(() => {
        // Add listener to update styles
        window
            .matchMedia("(prefers-color-scheme: dark)")
            .addEventListener("change", (e) =>
                onSelectMode(e.matches ? "dark" : "light")
            )

        // Setup dark/light mode for the first time
        onSelectMode(
            window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
        )

        // Remove listener
        return () => {
            window
                .matchMedia("(prefers-color-scheme: dark)")
                .removeEventListener("change", () => {})
        }
    }, [])

    return (
        <>
            <canvas
                id="c"
                className={mode === "dark" ? styles.dark : ""}
                width={canvasWidth}
                height={canvasHeight}
            />
            <div className={mode === "dark" ? styles.dark : ""}>
                <button
                    className={mode === "dark" ? styles.dark : ""}
                    onClick={addBoxHandler}
                >
                    새로운 박스 생성
                </button>
                <button
                    className={mode === "dark" ? styles.dark : ""}
                    onClick={addPointHandler}
                >
                    새로운 포인트 생성
                </button>
                <button
                    className={mode === "dark" ? styles.dark : ""}
                    onClick={removeHandler}
                >
                    선택한 박스/포인트 제거
                </button>
                <button
                    className={mode === "dark" ? styles.dark : ""}
                    onClick={clearAllHandler}
                >
                    모든 박스/포인트 제거
                </button>
            </div>
        </>
    )
}

export default withStreamlitConnection(StreamlitImgLabel)
