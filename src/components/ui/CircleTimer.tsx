const CircleTimer = ({duration, isRunning, time} : {duration: number, isRunning: boolean, time: number}) => {
    return (
        <div className="circle-timer">
            <svg
                className="circle-timer__svg"
                fill="none"
                height="30"
                stroke="#dc3545"
                width="30"
            >
                <circle
                    style={ { 'animation': duration + 's ' + (isRunning ? 'circletimer' : '') + ' linear' } }
                    className="circle-timer__svg__circle"
                    cx="15"
                    cy="15"
                    r="14"
                />
            </svg>
            <span className="circle-timer__num">{ time }</span>
        </div>
    )
}

export default CircleTimer;