package com.productmanagement.service;

import com.productmanagement.dto.ProductFieldGroupDTO;
import java.util.List;

public interface ProductFieldGroupService {
    
    List<ProductFieldGroupDTO> getAllGroups();
    
    ProductFieldGroupDTO getGroupById(Integer id);
    
    ProductFieldGroupDTO createGroup(ProductFieldGroupDTO request);
    
    ProductFieldGroupDTO updateGroup(Integer id, ProductFieldGroupDTO request);
    
    void deleteGroup(Integer id);
}
