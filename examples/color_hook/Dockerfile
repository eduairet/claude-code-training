FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY color_generator.py .

RUN mkdir /output

CMD ["python", "color_generator.py"]
