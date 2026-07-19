import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 500 },  // Spike to 500 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<1000'], // 95% of requests must complete below 300ms
    http_req_failed: ['rate<0.001'], // Less than 0.1% error rate
  },
};

const BASE_URL = 'http://localhost:3000/api/v1';

export default function () {
  // 1. Fetch products (Customer traffic)
  const resProducts = http.get(`${BASE_URL}/public/products`);
  check(resProducts, { 'status was 200 (products)': (r) => r.status == 200 });
  
  sleep(1);

  // 2. Fetch chef queue (Chef traffic)
  const resChef = http.get(`${BASE_URL}/chef/orders`);
  check(resChef, { 'status was 200 (chef)': (r) => r.status == 200 });

  sleep(1);

  // 3. Healthcheck probe (Infrastructure traffic)
  const resHealth = http.get(`${BASE_URL}/health/ready`);
  check(resHealth, { 'status was 200 (health)': (r) => r.status == 200 });

  sleep(1);
}
