import React, { useState } from 'react';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

const FleetStatusChart = ({ data, onFilter }) => {
    const [activeIndex, setActiveIndex] = useState(null);

    const totalVehicles = data.reduce((acc, curr) => acc + curr.value, 0);
    const isEmpty = totalVehicles === 0;
    const chartData = isEmpty ? [{ name: 'No Data', value: 1, color: '#e0e0e0' }] : data;

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    const handleClick = (entry, index) => {
        if (onFilter) {
            onFilter(entry.name);
        }
    };

    return (
        <Paper sx={{ p: 2, height: 350, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>Fleet Status</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <Box sx={{ flex: 1, height: '100%', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={isEmpty ? 0 : 5}
                                dataKey="value"
                                onMouseEnter={!isEmpty ? onPieEnter : undefined}
                                onClick={!isEmpty ? handleClick : undefined}
                                cursor={!isEmpty ? "pointer" : "default"}
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        style={{
                                            filter: !isEmpty && activeIndex === index ? 'drop-shadow(0px 0px 5px rgba(0,0,0,0.2))' : 'none',
                                            opacity: !isEmpty && (activeIndex === index || activeIndex === null) ? 1 : 0.6
                                        }}
                                    />
                                ))}
                            </Pie>
                            {!isEmpty && <Tooltip />}
                            {/* Custom Label for Center Text */}
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                <tspan x="50%" dy="-10" fontSize="24" fontWeight="bold">{totalVehicles}</tspan>
                                <tspan x="50%" dy="20" fontSize="14" fill="#666">Total</tspan>
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                </Box>

                {/* Custom Legend on the Right */}
                <Box sx={{ width: 200, pl: 2 }}>
                    {data.map((entry, index) => (
                        <Box
                            key={entry.name}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                p: 1,
                                borderRadius: 1,
                                cursor: 'pointer',
                                bgcolor: activeIndex === index ? 'action.hover' : 'transparent',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                            onClick={() => handleClick(entry, index)}
                        >
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: entry.color, mr: 1.5 }} />
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" color="text.secondary">{entry.name}</Typography>
                                <Typography variant="h6" fontWeight="bold" lineHeight={1}>
                                    {entry.value}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Paper>
    );
};

export default FleetStatusChart;
