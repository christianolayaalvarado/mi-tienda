"use client";

import { useMemo } from "react";
import { useMascotAnimation } from "@/lib/mascot/animationEngine";
import { MascotStates } from "@/lib/mascot/stateMachine";

export default function MascotAnimationController({

    children,

    auto = true,

    state: forcedState = null,

}) {

    const { state } = useMascotAnimation();

    const currentState = forcedState || (auto ? state : MascotStates.IDLE);

    const style = useMemo(() => {

        switch (currentState) {

            case MascotStates.JUMP:

                return {
                    transform: "translateY(-8px)",
                    transition: "transform .35s ease-in-out",
                };

            case MascotStates.HAPPY:

                return {
                    transform: "scale(1.08)",
                    transition: "transform .25s ease",
                };

            case MascotStates.THINKING:

                return {
                    transform: "rotate(-6deg)",
                    transition: "transform .35s ease",
                };

            case MascotStates.WAVE:

                return {
                    transform: "rotate(8deg)",
                    transition: "transform .25s ease",
                };

            default:

                return {
                    transform: "scale(1)",
                    transition: "transform .35s ease",
                };

        }

    }, [currentState]);

    return (

        <div
            style={style}
            className="inline-flex items-center justify-center"
        >

            {children}

        </div>

    );

}