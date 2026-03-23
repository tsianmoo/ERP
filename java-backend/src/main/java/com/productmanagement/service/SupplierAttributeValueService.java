package com.productmanagement.service;

import com.productmanagement.dto.SupplierAttributeValueDTO;
import java.util.List;

public interface SupplierAttributeValueService {
    
    List<SupplierAttributeValueDTO> getAllValues();
    
    List<SupplierAttributeValueDTO> getValuesByAttributeId(Integer attributeId);
    
    SupplierAttributeValueDTO getValueById(Integer id);
    
    SupplierAttributeValueDTO createValue(SupplierAttributeValueDTO request);
    
    SupplierAttributeValueDTO updateValue(Integer id, SupplierAttributeValueDTO request);
    
    void deleteValue(Integer id);
}
