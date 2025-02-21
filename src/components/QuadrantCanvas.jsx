import React, { useState, useRef, useEffect } from 'react';
import { evaluate} from 'mathjs';

const QuadrantCanvas = () => {
    const [point, setPoint] = useState({ x: 0, y: 0 });
    const [equation, setEquation] = useState('x^2 + y^2 = 25');
    const [animationProgress, setAnimationProgress] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const canvasSize = 1000;
    const initialViewUnits = 50; // Base grid units
    const unitStep = (canvasSize / (initialViewUnits * 2));
    const halfSize = canvasSize / 2;
    const dragRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        let animationFrame;

        const animate = () => {
            setAnimationProgress((prev) => {
                if (prev < 360) {
                    return prev + 2;
                } else {
                    setIsAnimating(false);
                    return prev;
                }
            });
        };

        if (isAnimating) {
            animationFrame = requestAnimationFrame(function animationLoop() {
                animate();
                if (isAnimating) {
                    requestAnimationFrame(animationLoop);
                }
            });
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [isAnimating]);

    const handleMouseDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left - halfSize) / unitStep;
        const y = (halfSize - (e.clientY - rect.top)) / unitStep;
        setPoint({ x: Math.round(x), y: Math.round(y) });
        dragRef.current = true;
    };

    const handleMouseUp = () => {
        dragRef.current = false;
    };

    const handleMouseMove = (e) => {
        if (!dragRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left - halfSize) / unitStep;
        const y = (halfSize - (e.clientY - rect.top)) / unitStep;
        setPoint({ x: Math.round(x), y: Math.round(y) });
    };

    const handleEquationChange = (e) => {
        setEquation(e.target.value);
    };

    const handlePlot = () => {
        setAnimationProgress(0);
        setIsAnimating(true);
    };

    const isCircleEquation = () => {
        const normalized = equation.replace(/\s+/g, '');
        return normalized.match(/^x\^2\+y\^2=([0-9]+)$/);
    };

    const getCircleRadius = () => {
        const match = isCircleEquation();
        if (match) {
            const rSquared = parseFloat(match[1]);
            return Math.sqrt(rSquared) * unitStep;
        }
        return 0;
    };

    const getCirclePoints = (radius, progress) => {
        const points = [];
        for (let angle = 0; angle <= progress; angle += 2) {
            const rad = (angle * Math.PI) / 180;
            const x = radius * Math.cos(rad);
            const y = radius * Math.sin(rad);
            points.push(`${x + halfSize},${halfSize - y}`);
        }
        return points.join(' ');
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error("Canvas is not available.");
            return;
        }
    
        const svg = canvas.querySelector('svg');
        if (!svg) {
            console.error("SVG element not found within canvas.");
            return;
        }
    
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'graph.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const getGraphPoints = (progress) => {
        const points = [];
        for (let x = -initialViewUnits; x <= initialViewUnits; x += 0.5) {
            try {
                const y = evaluate(equation.replace('y=', ''), { x });
                const canvasX = x * unitStep + halfSize;
                const canvasY = halfSize - y * unitStep;
                points.push(`${canvasX},${canvasY}`);
                if (points.length >= progress) break;
            } catch {
                continue;
            }
        }
        return points.join(' ');
    };

    return (
        <div className="flex flex-col items-center p-4">
            <div className="flex mb-4">
            <nav style={{
                padding: '10px',
                backgroundColor: '#1E3A8A',
                color: 'white',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <h1 style={{ margin: 0 }}>Quadrant Canvas</h1>
                <button onClick={handleDownload} style={{ padding: '8px 16px', backgroundColor: 'white', color: '#1E3A8A', border: 'none', cursor: 'pointer' }}>
                    Download Graph
                </button>
            </nav>

            <div style={{
                border: '1px solid #ddd',
                padding: '20px',
                maxWidth: '800px',
                margin: '0 auto',
                marginBottom: '20px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}>
                <input
                    type="text"
                    value={equation}
                    onChange={handleEquationChange}
                    placeholder="Enter equation (e.g. x^2 + y^2 = 25)"
                    style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        marginRight: '8px',
                        flexGrow: 1,
                        width: '60%'
                    }}
                />
                <button
                    onClick={handlePlot}
                    disabled={isAnimating}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: isAnimating ? '#ccc' : '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Plot
                </button>
            </div>
            <div className="relative bg-white border w-[1000px] h-[1000px] overflow-hidden"ref={canvasRef}>
                <svg 
                    width={canvasSize} 
                    height={canvasSize} 
                    onMouseDown={handleMouseDown} 
                    onMouseUp={handleMouseUp} 
                    onMouseMove={handleMouseMove}
                >
                    <line x1={halfSize} y1={0} x2={halfSize} y2={canvasSize} stroke="black" />
                    <line x1={0} y1={halfSize} x2={canvasSize} y2={halfSize} stroke="black" />

                    {Array.from({ length: initialViewUnits * 2 }).map((_, i) => {
                        const pos = i * unitStep;
                        const value = i - initialViewUnits;
                        const showLabel = value % 5 === 0;
                        return (
                            <React.Fragment key={i}>
                                <line x1={pos} y1={0} x2={pos} y2={canvasSize} stroke="lightgray" />
                                {showLabel && <text x={pos} y={halfSize + 15} fontSize="10" textAnchor="middle">{value}</text>}
                                <line x1={0} y1={pos} x2={canvasSize} y2={pos} stroke="lightgray" />
                                {showLabel && <text x={halfSize + 5} y={pos + 3} fontSize="10" textAnchor="start">{-value}</text>}
                            </React.Fragment>
                        );
                    })}

                    <circle cx={halfSize} cy={halfSize} r={5} fill="blue" />

                    <circle
                        cx={point.x * unitStep + halfSize}
                        cy={halfSize - point.y * unitStep}
                        r={8}
                        fill="red"
                        style={{ cursor: 'pointer' }}
                    />
                    <text x={point.x * unitStep + halfSize + 10} y={halfSize - point.y * unitStep} fontSize="12" fill="black">
                        ({point.x}, {point.y})
                    </text>

                    {isCircleEquation() ? (
                        <polyline
                            fill="none"
                            stroke="green"
                            strokeWidth="2"
                            points={getCirclePoints(getCircleRadius(), animationProgress)}
                        />
                    ) : (
                        <polyline
                            fill="none"
                            stroke="blue"
                            strokeWidth="2"
                            points={getGraphPoints(animationProgress)}
                        />
                    )}
                </svg>
            </div>
            <footer className="p-4 bg-gray-800 text-white">
                <p>Supports graphing circular equations (e.g., x^2 + y^2 = r^2) and basic coordinate plotting.</p>
            </footer>
        </div>
        </div>
    );
};

export default QuadrantCanvas;
