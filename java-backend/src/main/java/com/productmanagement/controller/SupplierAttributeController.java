package com.productmanagement.controller;

import com.productmanagement.dto.SupplierAttributeDTO;
import com.productmanagement.service.SupplierAttributeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/supplier-attrs")
@RequiredArgsConstructor
public class SupplierAttributeController {
    
    private final SupplierAttributeService attributeService;
    
    @GetMapping
    public ResponseEntity<List<SupplierAttributeDTO>> getAllAttributes() {
        return ResponseEntity.ok(attributeService.getAllAttributes());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SupplierAttributeDTO> getAttributeById(@PathVariable Integer id) {
        return ResponseEntity.ok(attributeService.getAttributeById(id));
    }
    
    @PostMapping
    public ResponseEntity<SupplierAttributeDTO> createAttribute(@RequestBody SupplierAttributeDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attributeService.createAttribute(request));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SupplierAttributeDTO> updateAttribute(@PathVariable Integer id, @RequestBody SupplierAttributeDTO request) {
        return ResponseEntity.ok(attributeService.updateAttribute(id, request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttribute(@PathVariable Integer id) {
        attributeService.deleteAttribute(id);
        return ResponseEntity.noContent().build();
    }
}
