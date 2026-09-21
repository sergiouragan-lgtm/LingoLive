import { Router, Request, Response } from 'express';
import { accessControlAuthorizationService } from '../services/access-control-authorization.service';

const router = Router();

router.post('/roles/create', async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await accessControlAuthorizationService.createRole(
      name,
      description,
      permissions
    );
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/roles/assign', async (req: Request, res: Response) => {
  try {
    const { userId, roleId, assignedBy, expiresAt } = req.body;
    const assignment = await accessControlAuthorizationService.assignRole(
      userId,
      roleId,
      assignedBy,
      expiresAt ? new Date(expiresAt) : undefined
    );
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/permissions/define', async (req: Request, res: Response) => {
  try {
    const { name, resource, action, description, category } = req.body;
    const permission = await accessControlAuthorizationService.definePermission(
      name,
      resource,
      action,
      description,
      category
    );
    res.status(201).json(permission);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/policies/create', async (req: Request, res: Response) => {
  try {
    const { name, rules } = req.body;
    const policy = await accessControlAuthorizationService.createAccessPolicy(
      name,
      rules
    );
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/attributes/define', async (req: Request, res: Response) => {
  try {
    const { name, type, values } = req.body;
    const attribute = await accessControlAuthorizationService.defineAttribute(
      name,
      type,
      values
    );
    res.status(201).json(attribute);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/abac/create', async (req: Request, res: Response) => {
  try {
    const { name, attributes, policy } = req.body;
    const control = await accessControlAuthorizationService.createAttributeBasedControl(
      name,
      attributes,
      policy
    );
    res.status(201).json(control);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/access/log', async (req: Request, res: Response) => {
  try {
    const { userId, resource, action, status, ipAddress, reason } = req.body;
    const log = await accessControlAuthorizationService.logAccessAttempt(
      userId,
      resource,
      action,
      status,
      ipAddress,
      reason
    );
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/roles/:assignmentId/revoke', async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const revoked = await accessControlAuthorizationService.revokeRole(assignmentId);
    res.status(200).json(revoked);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/users/:userId/permissions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const permissions = await accessControlAuthorizationService.getUserPermissions(userId);
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
