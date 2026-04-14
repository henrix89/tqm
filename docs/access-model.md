# Bruker- og Tilgangsmodell

Denne løsningen bygger videre på den eksisterende modulstrukturen i repoet og legger til et enkelt auth- og organisasjonslag for:

- firma (`Company`)
- avdelinger (`Department`)
- brukere (`User`)
- innlogging og JWT-basert auth
- rollebasert tilgang
- lederlinje via `reportsToUserId`

## Foreslått mappestruktur

```text
apps/
  backend/
    src/
      core/
        config.ts
        mongo.ts
      modules/
        auth/
          guards.ts
          middleware.ts
          routes.ts
          schemas.ts
          types.ts
          utils.ts
        companies/
          model.ts
          routes.ts
        departments/
          model.ts
          routes.ts
        users/
          model.ts
          routes.ts
          service.ts
        incidents/
        documents/
        inspections/
        kpi/
        surveys/
      routes/
        index.ts
  frontend/
    src/
      pages/
        LoginPage.tsx
        ProfilePage.tsx
        UsersPage.tsx
        DepartmentsPage.tsx
        DashboardPage.tsx
      features/
        auth/
        users/
        departments/
      lib/
        api.ts
        auth.ts
```

## Roller

- `superadmin`: ser og administrerer alt på tvers av firma
- `company_admin`: ser og administrerer alt i eget firma
- `manager`: ser brukere og innhold i egen avdeling
- `employee`: ser egne data og data som er eksplisitt tildelt dem
- `viewer`: kun lesetilgang til innhold de har tilgang til

## Tilgangsregler i første versjon

Bruk tilgangsmodellen enkelt:

- auth middleware leser JWT og legger brukerinfo i `req.auth`
- role guards stopper tilgang på rutenivå
- service-laget filtrerer data etter rolle og firma/avdeling

Dette er enklere å vedlikeholde enn å innføre et stort permissions-system for tidlig.

## API-flow

### Innlogging

1. `POST /api/v1/auth/login`
2. backend verifiserer e-post og passord med `bcrypt`
3. backend returnerer JWT + brukerprofil + `mustChangePassword`
4. frontend lagrer token og sender det som `Authorization: Bearer <token>`

### Tvungen passordendring

1. bruker logger inn første gang
2. backend returnerer `mustChangePassword: true`
3. frontend sender brukeren til passordbytte
4. `POST /api/v1/auth/change-password`
5. backend setter `mustChangePassword = false`

### Lederlinje

- `reportsToUserId` peker til nærmeste leder
- `GET /api/v1/auth/me/reports` eller `GET /api/v1/users/me/reports`
- brukes for teamoversikt og godkjenning/oppfølging

## Oppsett av MongoDB

1. Sett `MONGO_URL` i `.env`
2. Fyll ut seed-verdiene:

```env
SEED_COMPANY_NAME=TQM Demo
SEED_COMPANY_SLUG=tqm-demo
SEED_DEPARTMENT_NAME=Administrasjon
SEED_DEPARTMENT_CODE=ADM
SEED_ADMIN_FIRST_NAME=Kristian
SEED_ADMIN_LAST_NAME=Henriksen
SEED_ADMIN_EMAIL=deg@example.com
SEED_ADMIN_PASSWORD=ByttMeg123!
SEED_ADMIN_ROLE=superadmin
SEED_ADMIN_JOB_TITLE=Systemadministrator
```

3. Kjør seed-scriptet:

```bash
npm run seed:mongo-admin
```

Scriptet vil:
- opprette eller oppdatere firma
- opprette eller oppdatere avdeling
- opprette eller oppdatere første admin-bruker
- bcrypt-hashe passordet
- sette `mustChangePassword=true`

## Frontend-forslag

### 1. Login-side

Innhold:
- e-post
- passord
- logg inn-knapp
- håndtering av feil
- redirect til passordbytte hvis `mustChangePassword`

### 2. Rollebasert dashboard

- `superadmin`: systemstatus, firmaer, brukere, aktivitet
- `company_admin`: brukere, avdelinger, avvik, KPI for eget firma
- `manager`: eget team, avdelingsdata, saker som trenger oppfølging
- `employee`: egne oppgaver, egne avvik, egne dokumenter og profil
- `viewer`: lesetilgang til dashboard og tildelt innhold

### 3. Brukeradministrasjon

Sider/funksjoner:
- liste brukere
- opprette bruker
- endre rolle
- knytte bruker til firma og avdeling
- sette nærmeste leder
- deaktivere bruker

### 4. Avdelingsadministrasjon

- liste avdelinger
- opprette avdeling
- knytte leder til avdeling
- vise ansatte i avdeling

### 5. Profilside

- min profil
- stillingstittel
- avdeling
- nærmeste leder
- siste innlogging
- bytt passord

## Videre kobling til domene-modulene

Neste naturlige steg er å bruke `req.auth` aktivt inne i:

- avvik
- dokumenter
- vernerunder
- KPI
- spørreundersøkelser

Anbefalt enkel regel i første versjon:

- `employee`: egne eller tildelte saker
- `manager`: avdelingens saker
- `company_admin`: firmaets saker
- `superadmin`: alt
- `viewer`: kun lesing
