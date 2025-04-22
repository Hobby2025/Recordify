FROM node:20-alpine

WORKDIR /app

# package.json과 package-lock.json 먼저 복사
COPY package*.json ./

# 모든 의존성 설치 (개발 의존성 포함)
# 프로덕션에서는 --omit=dev 옵션 고려
RUN npm install

# 모든 소스 코드 복사
COPY . .

# Prisma Client 생성 (소스 코드 복사 후 실행)
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"] 