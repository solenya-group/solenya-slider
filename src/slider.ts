import { InputProps, div, setPropertyValue, getPropertyKey, mergeAttrs, getPropertyValue, HAttributes, merge } from "solenya"
import interact from 'interactjs'
import { NestedCSSProperties } from "typestyle/lib/types"

export interface SliderStyle {
    trackColor: string
    progressColor: string
    ticks: "none" | "ticks" | "labeled-ticks"
    currentLabel: (n: number) => string
    tickHeight: number
    tickLabelMargin: number
    tickStep: number
    tickLabel: (n: number) => string
    trackThickness: number
    thumbWidth: number
    thumbHeight: number
    thumbFocus: NestedCSSProperties
    labelFocus: NestedCSSProperties
}

const defaultSliderStyle = <SliderStyle>{ 
    trackColor: "#888",
    progressColor: "skyblue",
    ticks: "none",
    currentLabel: n => "" + n,
    tickHeight: 5,
    tickLabelMargin: 5,
    tickStep: 1,
    tickLabel: n => "" + n,
    trackThickness: 10,
    thumbWidth: 20,
    thumbHeight: 20,
    thumbFocus: { backgroundColor: "white" },
    labelFocus: { color: "black" }
}

export interface SliderProps extends InputProps<number> {
    min: number
    max: number
    step?: number,
    prefix?: string,
    style?: Partial<SliderStyle>
    thumbContainerAttrs?: HAttributes,
    thumbAttrs?: HAttributes,
    labelAttrs?: HAttributes
}

const getPercent = (props: SliderProps) => {
    const value = getPropertyValue(props.target, props.prop)
    return (value - props.min) / (props.max - props.min) * 100
}

export const slider = (props: SliderProps) => {
    const id = (props.prefix ? props.prefix + "-" : "") + "slider-" + getPropertyKey(props.prop)

    const myStyle = props.style = <SliderStyle>merge(props.style, defaultSliderStyle)

    const updateIndicators = (target: HTMLElement, setFocus = false) => {
        const percent = getPercent(props)
        const thumbContainer = target.getElementsByClassName("slider-thumb-container")[0] as HTMLElement
        thumbContainer.style.left = `${percent}%`
        const cl = myStyle.progressColor
        const cr = myStyle.trackColor
        target.style.background = `linear-gradient(to right, ${cl} 0%, ${cl} ${percent}%, ${cr} ${percent}%, ${cr} 100%)`
        if (setFocus)
            target.focus()
    }

    const onSlide = (event: any) => {
        const el = document.getElementById(id)!
        const x = event.type == "tap" ? (event.pageX - el.getBoundingClientRect().left) : event.pageX
        const fraction = constrain(x / el.clientWidth, 0, 1)
        const value = props.min + Math.round(fraction * (props.max - props.min))
        setPropertyValue(props.target, props.prop, value)
        updateIndicators(el, true)        
    }

    const cap = (side: "start" | "end") =>
        div({
            onclick: e => {
                setPropertyValue(props.target, props.prop, side == "start" ? props.min : props.max)
                updateIndicators(document.getElementById(id)!, true)
            },
            class: "slider-cap",
            style: {
                cursor: "pointer",
                borderTopLeftRadius: side == "start" ? myStyle.trackThickness / 2 : 0,
                borderBottomLeftRadius: side == "start" ? myStyle.trackThickness / 2 : 0,
                borderTopRightRadius: side == "end" ? myStyle.trackThickness / 2 : 0,
                borderBottomRightRadius: side == "end" ? myStyle.trackThickness / 2 : 0,
                height: myStyle.trackThickness + "px",
                width: (myStyle.thumbWidth / 2) + "px",
                backgroundColor: side == "start" ? myStyle.progressColor : myStyle.trackColor
            }
        })

    const value = getPropertyValue(props.target, props.prop)

    return (
        div({
            class: "slider-container",
            style: {
                display: "flex",
                alignItems: "center",
                width: "100%",
                marginBottom: props.style.ticks == "labeled-ticks" ? "2rem" : 0
            }
        },
            cap("start"),
            div(
                mergeAttrs(props.attrs, {
                    id: id,
                    tabindex: 0,
                    style: sliderStyle(props),
                    onAttached: e => {
                        updateIndicators(<HTMLElement>e)
                        interact('#' + id).draggable({
                            origin: 'self',
                            inertia: true,
                            modifiers: [
                                interact.modifiers.restrict({
                                    restriction: 'self'
                                })
                            ],
                            listeners: {
                                move: onSlide
                            }
                        }).on("tap", onSlide)
                            .styleCursor(false)
                    },
                    onkeydown: e => {
                        if (e.keyCode >= 37 && e.keyCode <= 40) {
                            const sign = e.keyCode == 37 || e.keyCode == 40 ? 1 : -1
                            const newValue = constrain(value - (props.step || 1) * sign, props.min, props.max)
                            setPropertyValue(props.target, props.prop, newValue)
                            updateIndicators(document.getElementById(id)!)
                        }
                    }
                }),
                ticks(props),
                div(mergeAttrs({ class: "slider-thumb-container", style: thumbContainerStyle }, props.thumbContainerAttrs),
                    div(mergeAttrs({ class: "slider-thumb", style: thumbStyle(props) }, props.thumbAttrs),
                        div(mergeAttrs({ class: "slider-label", style: labelStyle }, props.labelAttrs),
                            props.style?.currentLabel ? props.style?.currentLabel(value) : getPercent(props).toFixed(0)
                        )
                    )
                )
            ),
            cap("end")
        )
    )
}

const ticks = (props: SliderProps) =>
    props.style?.ticks == "none" ? undefined :
        div({
            style: {
                position: "absolute",
                left: 0,
                right: 0,
                top: "100%",
                display: "flex",
                justifyContent: "space-between",
                height: props.style!.tickHeight + "px",
                $nest: {
                    "> div": {
                        borderLeftWidth: "1px",
                        borderLeftStyle: "solid",
                        position: "relative",
                        $nest: {
                            "> div": {
                                position: "absolute",
                                top: "50%",
                                transform: `translate(-50%, ${props.style!.tickLabelMargin}px)`
                            }
                        }
                    }
                }
            }
        },
            range(0, (props.max - props.min) / (props.style?.tickStep || props.step || 1) + 1).map(x =>
                div({ style: { borderLeftColor: getPropertyValue(props.target, props.prop) <= x ? props.style?.trackColor : props.style?.progressColor } },
                    props.style?.ticks != "labeled-ticks" ?
                        undefined :
                        div(props.style.tickLabel ?
                            props.style.tickLabel!(props.min + (x * (props.step || 1))) :
                            props.min + (x * (props.step || 1))
                        )
                )
            )
        )

const sliderStyle = (props: SliderProps) => <NestedCSSProperties>{
    display: "flex",
    position: "relative",
    width: "100%",
    height: props.style!.trackThickness + "px",
    margin: props.style!.trackThickness + "px auto",
    backgroundColor: props.style!.trackColor,
    boxSizing: "border-box",
    touchAction: "none",
    "-ms-touch-action": "none",
    cursor: "pointer",
    $nest: {
        "&:focus": { outline: "none" },
        "&:focus .slider-thumb": props.style!.thumbFocus,                   
        "&:focus .slider-label": props.style!.labelFocus
    }
}

const thumbContainerStyle = <NestedCSSProperties>{
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
}

const thumbStyle = (props: SliderProps) => <NestedCSSProperties>{
    display: "flex",
    alignItems: "center",
    width: props.style!.thumbWidth + "px",
    height: props.style!.thumbHeight + "px",
    transform: "translateX(-50%)",
    border: "solid 1px #fff",
    borderRadius: "1em",
    backgroundColor: "#444"    
}

const labelStyle = <NestedCSSProperties>{
    outline: "none",
    whiteSpace: "nowrap",
    userSelect: "none",
    "-ms-user-select": "none",
    pointerEvents: "none",
    color: "white",
    width: "100%",
    textAlign: "center",
    fontWeight: "bold"
}

export const constrain = (x: number, min: number, max: number) =>
    Math.max(min, Math.min(max, x))

const range = (start: number, count: number, step: number = 1) =>
    Array.apply(0, Array(count))
        .map((element, index) => (index * step) + start)