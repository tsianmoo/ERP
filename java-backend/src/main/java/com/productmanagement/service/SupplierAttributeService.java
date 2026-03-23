package com.productmanagement.service;

import com.productmanagement.dto.SupplierAttributeDTO;
import java.util.List;

public interface SupplierAttributeService {
    
    List<SupplierAttributeDTO> getAllAttributes();
    
    SupplierAttributeDTO getAttributeById(Integer id);
    
    SupplierAttributeDTO createAttribute(SupplierAttributeDTO request);
    
    SupplierAttributeDTO updateAttribute(Integer id, SupplierAttributeDTO request);
    
    void deleteAttribute(Integer id);
}
