import express from 'express'

const app = express();

app.use(express.json());

class Employee{
  constructor(name, age, role) {
    this.name = name;
    this.age = age;
    this.role = role;
  }

  sayYourName(){
    return `my name is ${this.name} and age is ${this.age} years old, works as ${this.role}`;
  }
}

class Frontend extends Employee {
  constructor(name, age) {
    super(name, age, "frontend");
    this.skill = ['HTML', 'CSS', 'JavaScript', 'React'];
  }
  writeCode(){
    return `${this.name} writes ${this.skill.join(", ")} code`;
  }
}

const employees = [];

app.post('/employees', (req, res) =>{
  console.log("Request body", req.body);
  const { name, age, role, skill } = req.body;

  if(role === "Frontend"){
    const obj = new Frontend(
      name,
      age,
      skill
    );
    employees.push(obj);

    res.json({
      message:"Frontend Employee added"
    });

  } else {
    const obj = new Frontend(
      name,
      age,
      role
    );
    employees.push(obj);
    res.json({
      message:"Employee added"
    });
  }
});

app.get('/employees', (req, res)=>{
  res.json(employees);
});

app.get("/frontend", (req, res) => {

    const frontendEmployees = employees.filter(
        employee => employee.role === "frontend"
    );

    res.json(frontendEmployees);
});

app.get("/employees/:name", (req, res) => {

    const name = req.params.name;

    const userObj = employees.find(
        employee => employee.name === name);

    if (!userObj) {
        return res.status(404).send("Employee not found");
    }

    res.send(userObj.sayYourName());
});

app.listen(3000, ()=>console.log("server is running on port 3000"));