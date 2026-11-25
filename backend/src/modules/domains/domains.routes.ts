import { Router, type Request, type Response } from 'express';
import { DomainNotFoundError, getDomainInfo } from './domains.service.js';

const DOMAIN_REGEX = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

export const domainsRouter = Router();

domainsRouter.get('/:domain', async (req: Request<{ domain: string }>, res: Response) => {
  const domain = req.params.domain.trim().toLowerCase().replace(/\.$/, '');

  if (!DOMAIN_REGEX.test(domain)) {
    res.status(400).json({ error: `Invalid domain name: ${req.params.domain}` });
    return;
  }

  try {
    res.json(await getDomainInfo(domain));
  } catch (err) {
    if (err instanceof DomainNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    throw err;
  }
});
