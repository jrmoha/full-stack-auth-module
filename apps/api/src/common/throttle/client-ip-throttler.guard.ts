import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate limits by client IP (architecture §10). The key is the library's tracker: `req.ip`, which Express
 * resolves from X-Forwarded-For trusting exactly TRUST_PROXY_HOPS hops (set in configureApp), so a client
 * cannot choose its key with extra forwarded entries. IPv4-mapped addresses become plain IPv4 and other IPv6
 * addresses are grouped by /64, so one client cannot rotate addresses within its prefix for fresh buckets.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: Record<string, unknown>): Promise<string> {
    return super.getTracker(req);
  }
}
