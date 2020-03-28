# Solenya Slider

A custom slider for solenya that:

 * Optionally displays the current value
 * Optionally displays ticks or labeled ticks
 * Works consistently across all major browsers (including IE11) and mobile devices
 * Bypasses the `inputRange` control, to allow customisation without excessive browser-dependent css hacking
 * Internally leverages the `interactjs` library to ensure compatability with touch devices
 * Accessibility Support

# Installation

`npm solenya-slider`

# Playground / Demo

https://stackblitz.com/edit/solenya-slider

# Usage
The usage of `slider` is as follows:

```typescript
export class SliderTest extends Component
{
    rating = 70
    
    view() {
        return slider({
            target: this,
            prop: () => this.rating,
            min: 0,
            max: 100,
            style: {                  
                ticks: "ticks",
                thumbWidth: 50
            }
        })             
    }}
```
The visualisation of the current value can be a function of the underlying numeric value. For example:

```typescript
            style: {                  
                ...
                currentLabel: n => n + "%"
            }
```

The `style` property has common styling properties for sliders. However, for low level control we can set the attributes for each part of the slider. For example, here we customize the border of the slider thumb:

```typescript
        return slider({
            ....
            thumbAttrs: {
                boxShadow: "4px 4px 4px rgba(0, 0, 0, .2), 0 0 8px"
            }
        })  
```

You can set the focused styling of the thumb and label with the `thumbFocus` or `labelFocus` properties. For example:

```typescript
        return slider({
            ....
            style: {
                thumbFocus: {
                    backgroundColor: "hotpink"
                },
                labelFocus: {
                    color: "white"
                }
            }
        })  
```
# Future Improvements

Possible future improvements:

 * More extensibility
 * Vertical orientation
 * Select a range of values
 * Quick default styling for thumb (e.g. inline, outside, none)

 The code is small, so copy the source code to customize yourself if necessary.