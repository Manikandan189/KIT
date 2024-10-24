const mongoose=require('mongoose')
const express=require('express')
const bodyParser=require('body-parser')
const path=require('path')
const session = require('express-session');
const twilio = require('twilio');
const {Account,Database,Security_Database,ToDatabase,Tohistory, Principal_Database}=require('./schema-mongo');
const { Media } = require('twilio/lib/twiml/MessagingResponse');
const app=express()
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('css'));
app.use(express.static('js'));
app.use(express.static('img'));
main()
async function main()
{
    await mongoose.connect("mongodb://localhost:27017/KIT-DATABASE")
}

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }    
}));

app.get('/Form', async (req, res) => {
    try {
        const students=await Database.find({ status: "principal" ,type:"outpass"}).exec(); 
        res.render('FinalForm', {student});
    } catch (err) {
        res.status(500).send(err);
    }
});



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html','html-home.html'));
});
app.get('/Departments', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'html-departments.html'));
});
app.get('/ChangePassword', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'html-forgotPassword.html'));
});
app.get('/Database', async (req, res) => {
    try {
        const requests = await ToDatabase.find({}).exec();    
        res.render('FinalDatabase', { database: requests});
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});






//LoginRegister
app.get('/LoginRegister', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'html-login-register.html'));
});

app.post('/LoginRegister', async (req, res) => {
    try {
        const { image_R, first_name_R, last_name_R, email_id_R, create_password_R, re_password_R, register_number_R, phone_number_R, department_R, year_R, address_R } = req.body;
        
        // Check for password match
        if (create_password_R !== re_password_R) {
            return res.status(400).json({ message: "Passwords do not match" });
        }
        // Check if user already exists
        const existingUser = await Account.findOne({ email_id_R });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        
        
        // Create new user
        const newUser = new Account({
            image_R,
            first_name_R,
            last_name_R,
            email_id_R,
            create_password_R, 
            re_password_R,
            register_number_R,
            phone_number_R,
            department_R,
            year_R,
            address_R,

        });
      

        // Save new user
        await newUser.save();
        res.redirect('/StudentLogin');

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
});



//StudentLogin
app.get('/StudentLogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'html-student-login.html'));
});
app.post('/StudentLogin', async (req, res) => {
    try {
        const { student_email, student_password} = req.body;
        const user = await Account.findOne({ email_id_R :student_email});
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!(student_password===user.create_password_R)) {
            res.redirect('/StudentLogin')
        }
        req.session.user = {
            image_S:user.image_R,
            email_S: user.email_id_R,
            firstName_S: user.first_name_R,
            lastName_S: user.last_name_R,
            registerNumber_S: user.register_number_R,
            department_S: user.department_R,
            year_S: user.year_R,
            phoneNumber_S: user.phone_number_R,
            address_S: user.address_R
        };2
        
            res.redirect('/Register')
        
                   // console.log(student.status);
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
});




//stafflogin
app.get('/StaffLogin', (req, res) => {
    res.sendFile(path.join(__dirname,'html', 'html-staff-login.html'));
});
app.post('/StaffLogin',async (req,res)=>{
    try{
        const{staff_email ,staff_password}=req.body;
        if(staff_email==="rajamohamad@gmail.com" && staff_password==="raja")
        res.redirect('/StaffVerify')
    }
    catch(error){
        res.redirect('/StaffLogin')
    }

})



//PrincipalLogin
app.get('/PrincipalLogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'html-principal-login.html'));
});
app.post('/PrincipalLogin',async (req,res)=>{
    try{
        const{principal_email ,principal_password}=req.body;
        if(principal_email==="principal@gmail.com" && principal_password==="1970")
        res.redirect('/PrincipalVerify')
    }
    catch(error){
        res.redirect('/PrincipalLogin')
    }

})


//SecurityLogin
app.get('/SecurityLogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'html-security-login.html'));
});
app.post('/SecurityLogin',async (req,res)=>{
    try{
        const{security_email ,security_password}=req.body;
        if(security_email==="securitytemp@gmail.com" && security_password==="1980")
        res.redirect('/SecurityVerify')
    }
    catch(error){
        res.redirect('/SecurityLogin')
    }

})


//login page and login register page completed above





app.get('/Who', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'html-who.html'));
});







//OutpassRegister:
// Render the registration form page
app.get('/Register', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/StudentLogin');
    }
    res.render('html-register', { user: req.session.user });
});

// Handle the form submission
app.post('/Register', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/StudentLogin');
        }

        const { purpose_of_outpass, from_date, to_date,type } = req.body;
        const { firstName_S, lastName_S, registerNumber_S, year_S, department_S, address_S, phoneNumber_S, image_S } = req.session.user;
        console.log("type",type);
        const existingRecord = await Database.findOne( {$and: [{ register_number: registerNumber_S },{type:'homepass'}]});
        console.log(existingRecord);
        if (existingRecord) {
            return res.json({ success: false, message: "A request with this registration number already exists." });
        }

        const newstu = new Database({
            student_name: `${firstName_S} ${lastName_S}`,
            register_number: registerNumber_S,
            department: department_S,
            year: year_S,
            purpose_of_outpass,
            parent_conduct_number: phoneNumber_S,
            address: address_S,
            from_date,
            to_date,
            status: "advisor",
            type:type,
            image: image_S
        });

        await newstu.save();
        return res.json({ success: true, message: "Request sent to class Advisor." });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ success: false, message: "Error registering user", error: error.message });
    }
});







app.get('/OutpassRegister', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/StudentLogin');
    }
    res.render('OutpassRegister', { user: req.session.user });
});



app.get('/OndutyRegister', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/StudentLogin');
    }
    res.render('OndutyRegister', { user: req.session.user });
});













//staffverify section
let dept=" ";
app.post('/StaffVerify1', async (req, res) => {
    try {
        const { department } = req.body;
        dept=department;
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});





//Advisor verify section



app.get('/AdvisorVerify', async (req, res) => {
    try {
        const validDepartments = ['cse', 'csbs', 'aids', 'mech', 'aero', 'agri', 'eee', 'ece', 'bme', 'biotech', 'aiml', 'mca'];
        let students;
    
        if (validDepartments.includes(dept)) {
            students = await Database.find({ department: dept.toUpperCase(), status: 'advisor', type: 'homepass' }).exec();
        } else {
            students = await Database.find({ status: 'advisor', type: 'homepass' }).exec();
        }
    
        res.render('AdvisorVerify', { students: students });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
    
});

app.post('/AdvisorVerify', async (req, res) => {
    try {
        const {rejected_btn, Approv_btn, S_Id,status } = req.body;
        if (Approv_btn==="accept" && S_Id && status==="advisor") {
            const student = await Database.findById(S_Id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }

           student.status="hod";
           await student.save();
           console.log(student.parent_conduct_number);
           const studentPhoneNumber = +91+student.parent_conduct_number;
           const studentName = student.student_name;
           await sendApprovalMessageToStudent(studentPhoneNumber, studentName,"Advisor");
        }
        if (rejected_btn==="reject" && S_Id) {
            const deleteResult = await Database.deleteOne({ _id: S_Id });
            console.log('Delete Result:', deleteResult); 
        }
    

        res.redirect('/AdvisorVerify');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});










app.get('/AdvisorVerifyOutpass', async (req, res) => {
    try {
        const validDepartments = ['cse', 'csbs', 'aids', 'mech', 'aero', 'agri', 'eee', 'ece', 'bme', 'biotech', 'aiml', 'mca'];
        let students;
    
        if (validDepartments.includes(dept)) {
            students = await Database.find({ department: dept.toUpperCase(), status: 'advisor', type: 'outpass' }).exec();
        } else {
            students = await Database.find({ status: 'advisor', type: 'homepass' }).exec();
        }
    
        res.render('AdvisorVerifyOutpass', { students: students });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/AdvisorVerifyOutpass', async (req, res) => {
    try {
        const {rejected_btn, Approv_btn, S_Id,status } = req.body;
        if (Approv_btn==="accept" && S_Id && status==="advisor") {
            const student = await Database.findById(S_Id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
           student.status="hod";
           await student.save();
           console.log("st",status);
        }
        if (rejected_btn==="reject" && S_Id) {
            const deleteResult = await Database.deleteOne({ _id: S_Id });
            console.log('Delete Result:', deleteResult); 
        }
    

        res.redirect('/AdvisorVerifyOutpass');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});






app.get('/AdvisorVerifyOnduty', async (req, res) => {
    try {
        const validDepartments = ['cse', 'csbs', 'aids', 'mech', 'aero', 'agri', 'eee', 'ece', 'bme', 'biotech', 'aiml', 'mca'];
        let students;
    
        if (validDepartments.includes(dept)) {
            students = await Database.find({ department: dept.toUpperCase(), status: 'advisor', type: 'onduty' }).exec();
        } else {
            students = await Database.find({ status: 'advisor', type: 'homepass' }).exec();
        }
    

        res.render('AdvisorVerifyOnduty', { students: students });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/AdvisorVerifyOnduty', async (req, res) => {
    try {
        const {rejected_btn, Approv_btn, S_Id,status } = req.body;
        if (Approv_btn==="accept" && S_Id && status==="advisor") {
            const student = await Database.findById(S_Id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
           student.status="hod";
           await student.save();
           console.log("st",status);
        }
        if (rejected_btn==="reject" && S_Id) {
            const deleteResult = await Database.deleteOne({ _id: S_Id });
            console.log('Delete Result:', deleteResult); 
        }
    

        res.redirect('/AdvisorVerifyOnduty');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});





//staffverify section
app.get('/StaffVerify', async (req, res) => {
    try {
        const validDepartments = ['cse', 'csbs', 'aids', 'mech', 'aero', 'agri', 'eee', 'ece', 'bme', 'biotech', 'aiml', 'mca'];
        let students;
    
        if (validDepartments.includes(dept)) {
            students = await Database.find({ department: dept.toUpperCase(), status: 'hod', type: 'homepass' }).exec();
        } else {
            students = await Database.find({ status: 'hod', type: 'homepass' }).exec();
        }
    

        res.render('StaffVerify', { students: students });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});
 
app.post('/StaffVerify', async (req, res) => {
    try {
        
        const {rejected_btn, Approv_btn, S_Id,status } = req.body;
        console.log("Req",req.body);
        if (Approv_btn==="accept" && S_Id && status==="hod") {
            const student = await Database.findById(S_Id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
           student.status="principal";
           await student.save();
           console.log("st",status);
           console.log(student.parent_conduct_number);
           const studentPhoneNumber = +91+student.parent_conduct_number;
           const studentName = student.student_name;
           await sendApprovalMessageToStudent(studentPhoneNumber, studentName,"HOD");
        }
        if (rejected_btn==="reject" && S_Id) {
            const deleteResult = await Database.deleteOne({ _id: S_Id });
            console.log('Delete Result:', deleteResult); 
        }
    

        res.redirect('/StaffVerify');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});






app.get('/StaffVerifyOutpass', async (req, res) => {
    try {
        const validDepartments = ['cse', 'csbs', 'aids', 'mech', 'aero', 'agri', 'eee', 'ece', 'bme', 'biotech', 'aiml', 'mca'];
        let students;
    
        if (validDepartments.includes(dept)) {
            students = await Database.find({ department: dept.toUpperCase(), status: 'hod', type: 'outpass' }).exec();
        } else {
            students = await Database.find({ status: 'hod', type: 'outpass' }).exec();
        }
    

        res.render('StaffVerifyOutpass', { students: students });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/StaffVerifyOutpass', async (req, res) => {
    try {
        
        const {rejected_btn, Approv_btn, S_Id,status } = req.body;
        console.log("Req",req.body);
        if (Approv_btn==="accept" && S_Id && status==="hod") {
            const student = await Database.findById(S_Id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
           student.status="principal";
           await student.save();
           console.log("st",status);
        }
        if (rejected_btn==="reject" && S_Id) {
            const deleteResult = await Database.deleteOne({ _id: S_Id });
            console.log('Delete Result:', deleteResult); 
        }
    

        res.redirect('/StaffVerifyOutpass');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});







app.get('/StaffVerifyOnduty', async (req, res) => {
    try {
        const validDepartments = ['cse', 'csbs', 'aids', 'mech', 'aero', 'agri', 'eee', 'ece', 'bme', 'biotech', 'aiml', 'mca'];
        let students;
    
        if (validDepartments.includes(dept)) {
            students = await Database.find({ department: dept.toUpperCase(), status: 'hod', type: 'onduty' }).exec();
        } else {
            students = await Database.find({ status: 'hod', type: 'onduty' }).exec();
        }
    

        res.render('StaffVerifyOnduty', { students: students });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/StaffVerifyOnduty', async (req, res) => {
    try {
        
        const {rejected_btn, Approv_btn, S_Id,status } = req.body;
        console.log("Req",req.body);
        if (Approv_btn==="accept" && S_Id && status==="hod") {
            const student = await Database.findById(S_Id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
           student.status="principal";
           await student.save();
           console.log("st",status);
        }
        if (rejected_btn==="reject" && S_Id) {
            const deleteResult = await Database.deleteOne({ _id: S_Id });
            console.log('Delete Result:', deleteResult); 
        }
    

        res.redirect('/StaffVerifyOnduty');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});














//PrincipalVerify
app.get('/PrincipalVerify', async(req, res) => {
    try{
        const students=await Database.find({ status: "principal" ,type:"homepass"}).exec(); 
    res.render('PrincipalVerify', {students});
    }catch(err)
    {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});
app.post('/PrincipalVerify', async (req, res) => {
    try {
        const { rejected_btn, Approv_btn, S_Id, status } = req.body;

        if (Approv_btn === "accept" && S_Id && status === "principal") {
            const student = await Database.findById(S_Id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }

            student.status = "security";
            await student.save();
            console.log(student.parent_conduct_number);
            console.log(student.student_name);
            const studentPhoneNumber = +91+student.parent_conduct_number;
            const studentName = student.student_name;
            await sendApprovalMessageToStudent(studentPhoneNumber, studentName,"Principal");
        }

        if (rejected_btn === "reject" && S_Id) {
            const student = await Database.findById(S_Id);
            console.log(student.phone_number_R);
            console.log(student.student_name);
            const studentPhoneNumber = +917395851198;
            const studentName = student.student_name;
            await sendRejectMessageToStudent(studentPhoneNumber, studentName);




            const deleteResult=await Database.deleteOne({ _id: S_Id });
            console.log('Delete Result:', deleteResult); 




            
            res.redirect('/PrincipalVerify');
            return; // Ensure no further execution after response is sent
        }
        res.redirect('/PrincipalVerify');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});







app.get('/PrincipalVerifyOutpass', async(req, res) => {
    try{
        const students=await Database.find({ status: "principal" ,type:"outpass"}).exec(); 
    res.render('PrincipalVerifyOutpass', {students});
    }catch(err)
    {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});
app.post('/PrincipalVerifyOutpass', async (req, res) => {
    try {
        const {rejected_btn, Approv_btn, S_Id,status } = req.body;
        if (Approv_btn==="accept" && S_Id && status==="principal") {
            const student = await Database.findById(S_Id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
           student.status="security";
           await student.save();
           console.log("st",status);
        }
        if (rejected_btn==="reject" && S_Id) {
            const deleteResult = await Database.deleteOne({ _id: S_Id });
            console.log('Delete Result:', deleteResult); 
        }
    

        res.redirect('/PrincipalVerifyOutpass');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});





app.get('/PrincipalVerifyOnduty', async(req, res) => {
    try{
        const students=await Database.find({ status: "principal" ,type:"onduty"}).exec(); 
    res.render('PrincipalVerifyOnduty', {students});
    }catch(err)
    {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});
app.post('/PrincipalVerifyOnduty', async (req, res) => {
    try {
        const {rejected_btn, Approv_btn, S_Id,status } = req.body;
        if (Approv_btn==="accept" && S_Id && status==="principal") {
            const student = await Database.findById(S_Id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
           student.status="security";
           await student.save();
           console.log("st",status);
        }
        if (rejected_btn==="reject" && S_Id) {
            const deleteResult = await Database.deleteOne({ _id: S_Id });
            console.log('Delete Result:', deleteResult); 
        }
    

        res.redirect('/PrincipalVerifyOnduty');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});





//taffVerify
app.get('/SecurityVerify', async (req, res) => {
    try {
       const students=await Database.find({ status: "security" }).exec();
        res.render('SecurityVerify', { students});
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});
app.post('/SecurityVerify', async (req, res) => {
    try {
        const {rejected_btn, Approv_btn, S_Id,status } = req.body;
        console.log('Request Body:', req.body);

        if (Approv_btn==="accept" && S_Id && status==="security") {
            const student = await Database.findById(S_Id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
           
           student.status="history";
           await student.save();
           const final = new ToDatabase({
            student_name: student.student_name,
            register_number: student.register_number,
            department: student.department,
            year: student.year,
            purpose_of_outpass: student.purpose_of_outpass,
            parent_conduct_number: student.parent_conduct_number,
            from_date: student.from_date,
            to_date: student.to_date,
            status:student.status
        });
        await final.save();
        await Database.deleteOne({ _id: S_Id });

        }

        if (rejected_btn==="reject" && S_Id) {
            const deleteResult = await Database.deleteOne({ _id: S_Id });
            console.log('Delete Result:', deleteResult); 
        }

        res.redirect('/SecurityVerify');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});















//StatusCheck
app.post('/Status', async (req, res) => {
    
    try {
        const { register_number } = req.body;
        const hodRecord = await Database.findOne({ register_number });
        console.log("ss",hodRecord.status);
        console.log("ss",hodRecord.type);
        if (hodRecord && hodRecord.type==="homepass") {
            return res.json({ message: hodRecord.status });
        }
        if (hodRecord && hodRecord.type==="outpass") {
            return res.json({ message: hodRecord.status });
        }
        if (hodRecord && hodRecord.type==="onduty") {
            return res.json({ message: hodRecord.status });
        }
    } catch (error) {
        console.error("Error checking database:", error);
        res.status(500).json({ message: "Error checking database", error : hodRecord.status});
    }
});
let register = ""; 

app.post('/History', async (req, res) => {
    try {
        const { register_number } = req.body;
        register = register_number; 
        res.sendStatus(200);
    } catch (error) {
        console.error("Error storing history:", error);
        res.status(500).json({ message: "Error storing history", error: error.message });
    }
});

app.get('/History', async (req, res) => {
    try {
        console.log("hi",register);
        const requests = await ToDatabase.find({ register_number: register }).exec();
        res.render('StudentHistory', { database: requests });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});





const accountSid = 'ACb49c47989e138374e8fd5a190d9c5192';
const authToken = '4ae0a357ad5f7dc22d5ae7fc5e7ab7f3';
const client = new twilio(accountSid, authToken);

function sendApprovalMessageToStudent(studentPhoneNumber, studentName,approvedBy) {
    client.messages.create({
        body: `Hello ${studentName}, your request has been approved by the ${approvedBy}, Thank You`,
        from: 'whatsapp:+14155238886', // Your Twilio WhatsApp number
        to: `whatsapp:${studentPhoneNumber}`, // Student's phone number in WhatsApp format 
    })
    .then(message => console.log("Message sent with SID: " + message.sid))
    .catch(error => console.error("Error sending message:", error));
    console.log(client.message);
}


function sendRejectMessageToStudent(studentPhoneNumber, studentName) {
    client.messages.create({
        body: `Hello ${studentName}, your request has been Rejected by the principal`,
        from: 'whatsapp:+14155238886', // Your Twilio WhatsApp number
        to: `whatsapp:${studentPhoneNumber}` // Student's phone number in WhatsApp format
    })
    .then(message => console.log("Message sent with SID: " + message.sid))
    .catch(error => console.error("Error sending message:", error));
}


//port
const PORT = process.env.PORT || 5100;
app.listen(PORT);

