package com.productmanagement.service;

import com.productmanagement.dto.ProductAttributeGroupDTO;

import java.util.List;

public interface ProductAttributeGroupService {
    
    List<ProductAttributeGroupDTO> getAllGroups();
    
    ProductAttributeGroupDTO getGroupById(Integer id);
    
    ProductAttributeGroupDTO createGroup(ProductAttributeGroupDTO request);
    
    ProductAttributeGroupDTO updateGroup(Integer id, ProductAttributeGroupDTO request);
    
    void deleteGroup(Integer id);
}
