import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const {
  MONGO_URL,
  BCRYPT_ROUNDS = "10",
  SEED_COMPANY_NAME = "TQM Demo",
  SEED_COMPANY_SLUG = "tqm-demo",
  SEED_DEPARTMENT_NAME = "Administrasjon",
  SEED_DEPARTMENT_CODE = "ADM",
  SEED_ADMIN_FIRST_NAME,
  SEED_ADMIN_LAST_NAME,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD,
  SEED_ADMIN_ROLE = "superadmin",
  SEED_ADMIN_JOB_TITLE = "Systemadministrator",
} = process.env;

const allowedRoles = new Set(["superadmin", "company_admin", "manager", "employee", "viewer"]);

if (!MONGO_URL) {
  console.error("Missing MONGO_URL in environment.");
  process.exit(1);
}

if (!SEED_ADMIN_FIRST_NAME || !SEED_ADMIN_LAST_NAME || !SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
  console.error(
    "Missing one or more required seed variables: SEED_ADMIN_FIRST_NAME, SEED_ADMIN_LAST_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD."
  );
  process.exit(1);
}

if (!allowedRoles.has(SEED_ADMIN_ROLE)) {
  console.error(`Invalid SEED_ADMIN_ROLE: ${SEED_ADMIN_ROLE}`);
  process.exit(1);
}

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "companies" }
);

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    managerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "departments" }
);

departmentSchema.index({ companyId: 1, name: 1 }, { unique: true });

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: [...allowedRoles], required: true, default: "employee" },
    jobTitle: { type: String, trim: true, default: "" },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    reportsToUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "users" }
);

userSchema.index({ companyId: 1, email: 1 }, { unique: true });

const Company = mongoose.models.Company || mongoose.model("Company", companySchema);
const Department = mongoose.models.Department || mongoose.model("Department", departmentSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);

async function main() {
  await mongoose.connect(MONGO_URL);

  const company = await Company.findOneAndUpdate(
    { slug: SEED_COMPANY_SLUG.toLowerCase() },
    {
      $set: {
        name: SEED_COMPANY_NAME,
        slug: SEED_COMPANY_SLUG.toLowerCase(),
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const department = await Department.findOneAndUpdate(
    { companyId: company._id, name: SEED_DEPARTMENT_NAME },
    {
      $set: {
        code: SEED_DEPARTMENT_CODE,
        isActive: true,
      },
      $setOnInsert: {
        name: SEED_DEPARTMENT_NAME,
        companyId: company._id,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, Number(BCRYPT_ROUNDS));

  const user = await User.findOneAndUpdate(
    { companyId: company._id, email: SEED_ADMIN_EMAIL.toLowerCase() },
    {
      $set: {
        firstName: SEED_ADMIN_FIRST_NAME,
        lastName: SEED_ADMIN_LAST_NAME,
        email: SEED_ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: SEED_ADMIN_ROLE,
        jobTitle: SEED_ADMIN_JOB_TITLE,
        departmentId: department._id,
        companyId: company._id,
        reportsToUserId: null,
        isActive: true,
        mustChangePassword: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (SEED_ADMIN_ROLE === "manager") {
    department.managerUserId = user._id;
    await department.save();
  }

  console.log("Mongo seed completed successfully.");
  console.log(`Company: ${company.name} (${company._id})`);
  console.log(`Department: ${department.name} (${department._id})`);
  console.log(`Admin user: ${user.email} (${user._id})`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Mongo seed failed:", error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
