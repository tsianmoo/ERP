package com.productmanagement.repository;

import com.productmanagement.entity.ProductBasicField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductBasicFieldRepository extends JpaRepository<ProductBasicField, Integer> {
    
    List<ProductBasicField> findByEnabledTrueOrderBySortOrderAsc();
    
    List<ProductBasicField> findByGroupIdOrderBySortOrderAsc(Integer groupId);
    
    List<ProductBasicField> findByGroupIdIsNullOrderBySortOrderAsc();
    
    @Query("SELECT f FROM ProductBasicField f LEFT JOIN FETCH f.fieldGroup ORDER BY f.groupId ASC NULLS LAST, f.sortOrder ASC")
    List<ProductBasicField> findAllWithGroupOrderBySortOrder();
    
    Optional<ProductBasicField> findByDbFieldName(String dbFieldName);
    
    boolean existsByDbFieldName(String dbFieldName);
}
