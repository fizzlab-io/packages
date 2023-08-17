import { SvelteComponent } from 'svelte'

export function abc(element: HTMLElement) {
    const component = new SvelteComponent({
        target: element,
        props: {
            hello: 'world'
        }
    })
}
