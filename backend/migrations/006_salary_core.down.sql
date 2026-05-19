ALTER TABLE employee_allowance_histories DROP CONSTRAINT IF EXISTS employee_allowance_histories_salary_component_fkey;
ALTER TABLE employee_allowances           DROP CONSTRAINT IF EXISTS employee_allowances_salary_component_fkey;
DROP TABLE IF EXISTS allowance_matrix;
DROP TABLE IF EXISTS salary_matrix;
DROP TABLE IF EXISTS salary_components;
