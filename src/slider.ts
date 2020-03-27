import { InputProps, div, setPropertyValue, getPropertyKey, mergeAttrs, getPropertyValue, HAttributes, merge, Component, PropertyRef } from "solenya"
import interact from 'interactjs'
import { NestedCSSProperties } from "typestyle/lib/types"

export interface SliderStyle {
    trackColor: string
    progressColor: string
    ticks: "none" | "ticks" | "labeled-ticks"
    currentLabel: (n: number) => string
    tickHeight: number
    tickLabelMargin: number
    tickStep?: number
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
    tickLabel: n => "" + n,
    trackThickness: 10,
    thumbWidth: 30,
    thumbHeight: 30,
    thumbFocus: { backgroundColor: "white" },
    labelFocus: { color: "black" }
}

export interface SliderProps extends InputProps<number> {
    min: number
    max: number
    step?: number,
    prefix?: string,
    style?: Partial<SliderStyle>
    trackbarAttrs?: HAttributes,
    thumbContainerAttrs?: HAttributes,
    thumbAttrs?: HAttributes,
    labelAttrs?: HAttributes
}

export const slider = (props: SliderProps) =>
    new Slider(props).view()

class Slider implements Required<SliderProps>
{    
    target!: Component
    prop!: PropertyRef<number>
    min!: number
    max!: number
    step: number
    prefix: string    
    attrs: HAttributes = {}
    trackbarAttrs: HAttributes = {}
    thumbContainerAttrs: HAttributes = {}
    thumbAttrs: HAttributes = {}
    labelAttrs: HAttributes = {}
    style: SliderStyle

    constructor(props: SliderProps) {
        for (const key in props)
            this[key] = props[key]
        
        this.step = props.step || 1
        this.prefix = props.prefix || ""
        this.style = <SliderStyle>merge(props.style, defaultSliderStyle)                
    }  

    get value() {
        return getPropertyValue(this.target, this.prop)
    }     

    set value(value: number) {
        setPropertyValue(this.target, this.prop, value)
        this.updateThumbPosition()
    }

    get percent () {        
        return (this.value - this.min) / (this.max - this.min) * 100
    }

    get id() {
        const p = this.prefix ? this.prefix + "-" : ""
        return p + "slider-" + getPropertyKey(this.prop)
    }

    get sliderElement() {
        return document.getElementById(this.id)!
    }

    get trackbarElement() {        
        return this.sliderElement.querySelector(".slider-trackbar") as HTMLElement
    }

    get thumbContainerElement() {
        return this.trackbarElement.querySelector(".slider-thumb-container") as HTMLElement
    }

    updateThumbPosition() {
        this.target.onRefreshed(() => {
            this.thumbContainerElement.style.left = `${this.percent}%`
            const cl = this.style.progressColor
            const cr = this.style.trackColor
            const p = this.percent
            this.trackbarElement.style.background = `linear-gradient(to right, ${cl} 0%, ${cl} ${p}%, ${cr} ${p}%, ${cr} 100%)`
        })
    }

    onSlide (event: any) {        
        const x = event.type == "tap" ? (event.pageX - this.trackbarElement.getBoundingClientRect().left) : event.pageX
        const fraction = constrain(x / this.trackbarElement.clientWidth, 0, 1)
        this.value = this.min + Math.round(fraction * (this.max - this.min) / this.step!) * this.step!        
        this.sliderElement.focus()
    }

    capView (side: "start" | "end") {
        return (
            div({
                onclick: e => {
                    this.value = side == "start" ? this.min : this.max
                    this.sliderElement.focus()
                },
                class: "slider-cap",
                style: {
                    cursor: "pointer",
                    borderTopLeftRadius: side == "start" ? this.style.trackThickness / 2 : 0,
                    borderBottomLeftRadius: side == "start" ? this.style.trackThickness / 2 : 0,
                    borderTopRightRadius: side == "end" ? this.style.trackThickness / 2 : 0,
                    borderBottomRightRadius: side == "end" ? this.style.trackThickness / 2 : 0,
                    height: this.style.trackThickness + "px",
                    width: (this.style.thumbWidth / 2) + "px",
                    backgroundColor: side == "start" ? this.style.progressColor : this.style.trackColor
                }
            })
        )
    }

    thumbView() {
        return (
            div(mergeAttrs({ class: "slider-thumb-container", style: this.thumbContainerStyle() }, this.thumbContainerAttrs),
                div(mergeAttrs({ class: "slider-thumb", style: this.thumbStyle() }, this.thumbAttrs),
                    div(mergeAttrs({ class: "slider-label", style: this.labelStyle() }, this.labelAttrs),
                        this.style.currentLabel ? this.style.currentLabel(this.value) : this.value
                    )
                )
            )
        )
    }

    valueAtTickStep(x: number) {
        return this.min + x * (this.style.tickStep || this.step)
    }

    ticksView() {
        return this.style.ticks == "none" ?
            undefined :
            div({
                class: "slider-ticks",
                style: this.ticksStyle()
            },
                range(0, (this.max - this.min) / (this.style.tickStep || this.step) + 1).map(x =>
                    div({
                        style: {
                            borderLeftColor: getPropertyValue(this.target, this.prop) <= x ?
                        this.style.trackColor : this.style.progressColor } },
                        this.style.ticks != "labeled-ticks" ?
                            undefined :
                            div(!this.style.tickLabel ?
                                this.valueAtTickStep(x) :
                                this.style.tickLabel(this.valueAtTickStep(x))
                            )
                    )
                )
            )
    }

    trackbarView() {
        return (
            div(mergeAttrs(this.trackbarAttrs, {
                class: "slider-trackbar",
                style: this.trackbarStyle(),
                onAttached: e => {
                    this.updateThumbPosition()
                    interact('#' + this.id + ">.slider-trackbar").draggable({
                        origin: 'self',
                        inertia: true,
                        modifiers: [
                            interact.modifiers.restrict({
                                restriction: 'self'
                            })
                        ],
                        listeners: {
                            move: e => this.onSlide(e)
                        }
                    })
                        .on("tap", e => this.onSlide(e))
                        .styleCursor(false)
                }
            }),
                this.ticksView(),
                this.thumbView()
            )
        )
    }

    view() {
        return (
            div(mergeAttrs(this.attrs, {
                id: this.id,
                class: "slider",
                tabindex: 0,
                style: this.sliderStyle(),
                onkeydown: e => {
                    if (e.keyCode >= 37 && e.keyCode <= 40) {
                        const sign = e.keyCode == 37 || e.keyCode == 40 ? 1 : -1
                        this.value = constrain(this.value - this.step * sign, this.min, this.max)                        
                        this.sliderElement.focus()
                    }
                }
            }),
                this.capView("start"),
                this.trackbarView(),
                this.capView("end")
            )
        )
    }

    sliderStyle() {
        return <NestedCSSProperties>{
            display: "flex",
            alignItems: "center",
            width: "100%",
            marginBottom: this.style.ticks == "labeled-ticks" ? "2rem" : 0,
            "-webkit-touch-callout": "none",
            "-webkit-tap-highlight-color": "transparent",
            userSelect: "none",
            "-moz-user-select": "none",
            "-webkit-user-select": "none",
            "-ms-user-select": "none",
            $nest: {
                "&:focus": { outline: "none" },
                "&:focus .slider-thumb": this.style.thumbFocus,
                "&:focus .slider-label": this.style.labelFocus
            }
        }
    }

    trackbarStyle() {
        return <NestedCSSProperties>{
            display: "flex",
            position: "relative",
            width: "100%",
            height: this.style.trackThickness + "px",
            margin: this.style.trackThickness + "px auto",
            backgroundColor: this.style.trackColor,
            boxSizing: "border-box",
            touchAction: "none",
            "-ms-touch-action": "none",
            cursor: "pointer"
        }
    }

    thumbContainerStyle() {
        return <NestedCSSProperties> {
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }
    }

    thumbStyle() {
        return <NestedCSSProperties>{
            display: "flex",
            alignItems: "center",
            width: this.style.thumbWidth + "px",
            height: this.style.thumbHeight + "px",
            transform: "translateX(-50%)",
            border: "solid 1px #fff",
            borderRadius: this.style.thumbWidth,
            boxShadow: "4px 4px 4px rgba(0, 0, 0, .2), 0 0 4px rgba(0, 0, 0, .2)",
            backgroundColor: "#444"
        }
    }

    labelStyle() {
        return <NestedCSSProperties>{
            outline: "none",
            whiteSpace: "nowrap",            
            pointerEvents: "none",
            color: "white",
            width: "100%",
            textAlign: "center",
            fontWeight: "bold"
        }
    }

    ticksStyle() {
        return <NestedCSSProperties>{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            display: "flex",
            justifyContent: "space-between",
            height: this.style.tickHeight + "px",
            $nest: {
                "> div": {
                    borderLeftWidth: "1px",
                    borderLeftStyle: "solid",
                    position: "relative",
                    $nest: {
                        "> div": {
                            position: "absolute",
                            top: "50%",
                            transform: `translate(-50%, ${this.style.tickLabelMargin}px)`,
                        }
                    }
                }
            }
        }
    }
}

const constrain = (x: number, min: number, max: number) =>
    Math.max(min, Math.min(max, x))

const range = (start: number, count: number, step: number = 1) =>
    Array.apply(0, Array(count))
        .map((element, index) => (index * step) + start)