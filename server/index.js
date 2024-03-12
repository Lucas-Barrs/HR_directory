const express = require('express');
const app = express();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_db');


app.use(express.json());


app.get('/api/employees', async (req, res, next)=> {
  try{
    const SQL = `
      SELECT *
      FROM employees`;
      const response = await client.query(SQL);
      res.send(response.rows);
    }
    catch(er){
      next(er);
    }
});

app.delete('/api/employees/:id', async (req, res, next)=> {
  try {
    const SQL = `
      DELETE FROM employees
      WHERE id = $1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  }
  catch(er){
    next(er);
  }
});

app.post('/api/employees', async (req, res, next)=> {
  try {
    const SQL = `
      INSERT INTO employees(name, department_id)
      VALUES($1, $2)
      RETURNING * `;
    const response = await client.query(SQL, [req.body.name, req.body.department_id]);
    res.send(response.rows[0]);
  }
  catch(er){
    next(er);
  }
});

app.put('/api/employees/:id', async (req, res, next)=> {
  try {
    const SQL = `
      UPDATE employees
      SET name=$1, department_id=$2
      WHERE id = $3
      RETURNING * `;
    const response = await client.query(SQL, [req.body.name, req.body.department_id, req.params.id]);
    res.send(response.rows[0]);
  }
  catch(er){
    next(er);
  }
});

app.get('/api/departments', async(req, res, next)=> {
  try {
    const SQL = `
      SELECT *
      FROM departments`;
    const response = await client.query(SQL);
    res.send(response.rows);
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  res.status(err.status || 500).send({ error: err.message || err});
});

const init = async()=> {
  console.log('conecting to bd');
  await client.connect();
  console.log('connected to bd');
  let SQL = `
  DROP TABLE IF EXISTS employees;
  DROP TABLE IF EXISTS departments;
  CREATE TABLE departments(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
  );
  CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL
  );
`;
await client.query(SQL);
console.log('tables created');
SQL = `
    INSERT INTO departments(name) VALUES('deli');
    INSERT INTO departments(name) VALUES('bakery');
    INSERT INTO departments(name) VALUES('grocery');
    INSERT INTO departments(name) VALUES('meat');
    INSERT INTO departments(name) VALUES('customer service');
    INSERT INTO employees (name, department_id) VALUES('Karley', ( SELECT department_id FROM departmet WHERE name='bakery'));
    INSERT INTO employees (name, department_id) VALUES('Timmy', ( SELECT department_id FROM departmet WHERE name='customer service'));
    INSERT INTO employees (name, department_id) VALUES('McCool', ( SELECT department_id FROM departmet WHERE name='meat'));
    INSERT INTO employees (name, department_id) VALUES('Lucas', ( SELECT department_id FROM departmet WHERE name='deli'));
    INSERT INTO employees (name, department_id) VALUES('Hope', ( SELECT department_id FROM departmet WHERE name='deli'));
    INSERT INTO employees (name, department_id) VALUES('Kayla', ( SELECT department_id FROM departmet WHERE name='deli'));
    INSERT INTO employees (name, department_id) VALUES('Ray', ( SELECT department_id FROM departmet WHERE name='deli'));
    INSERT INTO employees (name, department_id) VALUES('Richard', ( SELECT department_id FROM departmet WHERE name='customer service'));
    INSERT INTO employees (name, department_id) VALUES('Diane', ( SELECT department_id FROM departmet WHERE name='customer service'));
    INSERT INTO employees (name, department_id) VALUES('Missy', ( SELECT department_id FROM departmet WHERE name='bakery'));
`;
await client.query(SQL);
console.log('seeded data');

const port = process.env.PORT || 3000;
app.listen(port, ()=> {
  console.log(`listening on port ${port}`);
  console.log(`curl localhost:${port}/api/departments`);
  console.log(`curl localhost:${port}/api/employees`);
  console.log(`curl localhost:${port}/api/employees/1 -X DELETE`);
  console.log(`curl localhost:${port}/api/employees -X POST -d '{"name":"Mike", "department_id": 3}' -H "Content-Type:application/json"`);
  console.log(`curl localhost:${port}/api/employees/2 -X PUT -d '{"name":"update name", "department_id": 3}' -H "Content-Type:application/json"`);
});
}

init();