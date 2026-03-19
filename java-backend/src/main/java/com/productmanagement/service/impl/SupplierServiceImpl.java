package com.productmanagement.service.impl;

import com.productmanagement.dto.SupplierDTO;
import com.productmanagement.entity.Supplier;
import com.productmanagement.repository.SupplierRepository;
import com.productmanagement.service.SupplierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository repository;
    
    @Override
    public List<SupplierDTO> getAllSuppliers() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public SupplierDTO getSupplierById(Integer id) {
        Supplier supplier = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("供应商不存在: " + id));
        return toDTO(supplier);
    }
    
    @Override
    @Transactional
    public SupplierDTO createSupplier(SupplierDTO request) {
        Supplier supplier = new Supplier();
        supplier.setSupplierCode(request.getSupplierCode());
        supplier.setSupplierName(request.getSupplierName());
        supplier.setBasicInfo(request.getBasicInfo());
        supplier.setStatus(request.getStatus() != null ? request.getStatus() : "active");
        
        Supplier saved = repository.save(supplier);
        log.info("创建供应商成功，ID: {}", saved.getId());
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public SupplierDTO updateSupplier(Integer id, SupplierDTO request) {
        Supplier supplier = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("供应商不存在: " + id));
        
        if (request.getSupplierCode() != null) supplier.setSupplierCode(request.getSupplierCode());
        if (request.getSupplierName() != null) supplier.setSupplierName(request.getSupplierName());
        if (request.getBasicInfo() != null) supplier.setBasicInfo(request.getBasicInfo());
        if (request.getStatus() != null) supplier.setStatus(request.getStatus());
        
        Supplier updated = repository.save(supplier);
        log.info("更新供应商成功，ID: {}", updated.getId());
        return toDTO(updated);
    }
    
    @Override
    @Transactional
    public void deleteSupplier(Integer id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("供应商不存在: " + id);
        }
        repository.deleteById(id);
        log.info("删除供应商成功，ID: {}", id);
    }
    
    private SupplierDTO toDTO(Supplier supplier) {
        return SupplierDTO.builder()
                .id(supplier.getId())
                .supplierCode(supplier.getSupplierCode())
                .supplierName(supplier.getSupplierName())
                .basicInfo(supplier.getBasicInfo())
                .status(supplier.getStatus())
                .createdAt(supplier.getCreatedAt())
                .updatedAt(supplier.getUpdatedAt())
                .build();
    }
}
