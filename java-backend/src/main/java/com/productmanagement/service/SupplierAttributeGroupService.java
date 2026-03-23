package com.productmanagement.service;

import com.productmanagement.dto.SupplierAttributeGroupDTO;
import java.util.List;

public interface SupplierAttributeGroupService {
    
    List<SupplierAttributeGroupDTO> getAllGroups();
    
    SupplierAttributeGroupDTO getGroupById(Integer id);
    
    SupplierAttributeGroupDTO createGroup(SupplierAttributeGroupDTO request);
    
    SupplierAttributeGroupDTO updateGroup(Integer id, SupplierAttributeGroupDTO request);
    
    void deleteGroup(Integer id);
}
