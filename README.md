# mcq for all

## Dev
npm install
npm run data:build
npm run dev

افتح المسار: /mcq/

## Data pipeline
- ضع CSV داخل content/{college}/{stage}/{term}/{subject}.csv
- ثم:
  npm run data:build

## Validate
npm run data:validate

## PDF
npm run pdf:subject -- --path data/medicine/stage-1/term-1/biochemistry.json
