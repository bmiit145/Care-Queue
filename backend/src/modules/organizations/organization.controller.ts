import { Request, Response } from 'express';
import { Organization } from './organization.model';
import { failed } from '../../shared/http/respond';

export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, contactEmail, contactPhone, address } = req.body;
    
    const newOrganization = new Organization({
      name,
      type,
      contactEmail,
      contactPhone,
      address,
    });

    const savedOrganization = await newOrganization.save();
    res.status(201).json(savedOrganization);
  } catch (error) {
    failed(res, 'Error creating organization', error);
  }
};

export const getOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizations = await Organization.find({ isActive: true });
    res.status(200).json(organizations);
  } catch (error) {
    failed(res, 'Error fetching organizations', error);
  }
};
