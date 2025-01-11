import 'zone.js';

// Buffer polyfill
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer; 