package com.productmanagement.controller;

import com.productmanagement.dto.CodeRuleDTO;
import com.productmanagement.service.CodeRuleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "编码规则管理", description = "商品编码规则相关接口")
@RestController
@RequestMapping("/api/products/code-rules")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CodeRuleController {
    
    private final CodeRuleService service;
    
    @Operation(summary = "获取所有编码规则")
    @GetMapping
    public ResponseEntity<?> getAllRules() {
        try {
            List<CodeRuleDTO> rules = service.getAllRules();
            return ResponseEntity.ok(Map.of("data", rules));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取编码规则详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getRuleById(@PathVariable Long id) {
        try {
            CodeRuleDTO rule = service.getRuleById(id);
            return ResponseEntity.ok(Map.of("data", rule));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建编码规则")
    @PostMapping
    public ResponseEntity<?> createRule(@RequestBody CodeRuleDTO request) {
        try {
            CodeRuleDTO rule = service.createRule(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", rule));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新编码规则")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRule(@PathVariable Long id, @RequestBody CodeRuleDTO request) {
        try {
            CodeRuleDTO rule = service.updateRule(id, request);
            return ResponseEntity.ok(Map.of("data", rule));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除编码规则")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRule(@PathVariable Long id) {
        try {
            service.deleteRule(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
