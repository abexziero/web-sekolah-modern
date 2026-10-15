import { Children, isValidElement, cloneElement, type ReactNode, type ReactElement } from "react";
type Section = {
    id: string;
    visible: boolean;
    animation: string;
};
export function HomeSections({ sections, children }: {
    sections: Section[];
    children: ReactNode;
}) {
    const elements = Children.toArray(children).filter(isValidElement) as ReactElement<{
        id?: string;
        className?: string;
    }>[];
    return sections.filter(section => section.visible).map(section => {
        const element = elements.find(item => item.props.id === section.id);
        return element ? cloneElement(element, { key: section.id, className: `${element.props.className || ""} motion-${section.animation}` }) : null;
    });
}
