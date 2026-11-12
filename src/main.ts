// The only script that runs on the page: Vercel Analytics (page views, referrers; no cookies).
import { inject } from '@vercel/analytics';
import './style.css';

inject();
