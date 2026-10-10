-- =======================================================
-- GramConnect – Initial Sample Records
-- Run this in your cloud database (e.g. Neon SQL Editor) if you want seed data
-- =======================================================

INSERT INTO complaints (title, description, category, location, priority, status, created_at)
VALUES 
('Water shortage in village', 'Drinking water is not available for two days from the main overhead reservoir.', 'Water Supply', 'Main Village Square', 'HIGH', 'ASSIGNED', NOW() - INTERVAL '2 days'),
('Street light flickering near school', 'The pole streetlight is broken and off at night causing safety hazards.', 'Street Lights', 'School Road, Ward 4', 'MEDIUM', 'IN_PROGRESS', NOW() - INTERVAL '1 day'),
('Drainage overflow on East Street', 'Monsoon runoff is overflowing onto the walking road.', 'Drainage', 'East Street, Ward 2', 'MEDIUM', 'PENDING', NOW() - INTERVAL '12 hours'),
('Garbage bin overflow near weekly market', 'Community bins are full and spilling over.', 'Garbage', 'Market Yard, Ward 1', 'LOW', 'PENDING', NOW() - INTERVAL '6 hours'),
('Broken transformer wire sparked', 'Low hanging power cable near agricultural fields.', 'Electricity', 'Field Road, Sector 3', 'HIGH', 'RESOLVED', NOW() - INTERVAL '3 days');
