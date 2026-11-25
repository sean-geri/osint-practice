import { Router, type Request, type Response } from 'express';
import { getIpInfo, IpLookupError, ReservedIpError } from './ips.service.js';
import { isReservedIp, parseIp } from './ips.validation.js';

export const ipsRouter = Router();

ipsRouter.get('/:ip', async (req: Request<{ ip: string }>, res: Response) => {
  const parsed = parseIp(req.params.ip);

  if (!parsed) {
    res.status(400).json({ error: `Invalid IP address: ${req.params.ip}` });
    return;
  }
  if (isReservedIp(parsed)) {
    res.status(400).json({ error: `IP address is private or reserved: ${parsed.ip}` });
    return;
  }

  try {
    res.json(await getIpInfo(parsed));
  } catch (err) {
    if (err instanceof ReservedIpError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof IpLookupError) {
      console.error(err);
      res.status(502).json({ error: 'Failed to fetch IP information from IPinfo' });
      return;
    }
    throw err;
  }
});
